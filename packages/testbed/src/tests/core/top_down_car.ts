/*
 * Author: Chris Campbell - www.iforce2d.net
 *
 * Copyright (c) 2006-2012 Erin Catto http://www.box2d.org
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import {
    b2Body,
    b2World,
    b2BodyType,
    b2PolygonShape,
    b2Vec2,
    b2RevoluteJoint,
    b2RevoluteJointDef,
    b2Clamp,
    b2Fixture,
    b2Joint,
    b2FixtureDef,
    b2Contact,
} from "@plane2d/core";

import { Test, DestructionListener } from "../../test";
import { Settings } from "../../settings";
import { hotKey, HotKey } from "../../utils/hotkeys";

const DEGTORAD = 0.0174532925199432957;
// const RADTODEG = 57.295779513082320876;

const TDC_LEFT = 0x1;
const TDC_RIGHT = 0x2;
const TDC_UP = 0x4;
const TDC_DOWN = 0x8;

/**
 * types of fixture user data
 */
const FUD_CAR_TIRE = 0;
const FUD_GROUND_AREA = 1;

/**
 * a class to allow subclassing of different fixture user data
 */
export class FixtureUserData {
    public m_type: number;

    constructor(type: number) {
        this.m_type = type;
    }

    public getType(): number {
        return this.m_type;
    }
}

/**
 * class to allow marking a fixture as a car tire
 */
export class CarTireFUD extends FixtureUserData {
    constructor() {
        super(FUD_CAR_TIRE);
    }
}

// /**
//  * class to allow marking a fixture as a ground area
//  */
export class GroundAreaFUD extends FixtureUserData {
    public frictionModifier: number;

    public outOfCourse: boolean;

    constructor(fm: number, ooc: boolean) {
        super(FUD_GROUND_AREA);
        this.frictionModifier = fm;
        this.outOfCourse = ooc;
    }
}

export class TDTire {
    public m_groundAreas: GroundAreaFUD[] = [];

    public m_body: b2Body;

    public m_currentTraction = 1;

    public m_maxForwardSpeed = 0;

    public m_maxBackwardSpeed = 0;

    public m_maxDriveForce = 0;

    public m_maxLateralImpulse = 0;

    constructor(world: b2World) {
        this.m_body = world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
        });

        const polygonShape = new b2PolygonShape();
        polygonShape.SetAsBox(0.5, 1.25);
        const fixture = this.m_body.CreateFixture(polygonShape, 1); // shape, density
        fixture.SetUserData(new CarTireFUD());

        this.m_body.SetUserData(this);
    }

    public setCharacteristics(
        maxForwardSpeed: number,
        maxBackwardSpeed: number,
        maxDriveForce: number,
        maxLateralImpulse: number,
    ): void {
        this.m_maxForwardSpeed = maxForwardSpeed;
        this.m_maxBackwardSpeed = maxBackwardSpeed;
        this.m_maxDriveForce = maxDriveForce;
        this.m_maxLateralImpulse = maxLateralImpulse;
    }

    public addGroundArea(ga: GroundAreaFUD): void {
        this.m_groundAreas.push(ga);
        this.updateTraction();
    }

    public removeGroundArea(ga: GroundAreaFUD): void {
        this.m_groundAreas.splice(this.m_groundAreas.indexOf(ga));
        this.updateTraction();
    }

    public updateTraction(): void {
        if (this.m_groundAreas.length === 0) {
            this.m_currentTraction = 1;
        } else {
            // find area with highest traction
            this.m_currentTraction = 0;
            this.m_groundAreas.forEach((ga) => {
                if (ga.frictionModifier > this.m_currentTraction) {
                    this.m_currentTraction = ga.frictionModifier;
                }
            });
        }
    }

    public getLateralVelocity(): b2Vec2 {
        const currentRightNormal = this.m_body.GetWorldVector(new b2Vec2(1, 0), new b2Vec2());
        return currentRightNormal.Scale(b2Vec2.Dot(currentRightNormal, this.m_body.GetLinearVelocity()));
    }

    public getForwardVelocity(): b2Vec2 {
        const currentForwardNormal = this.m_body.GetWorldVector(new b2Vec2(0, 1), new b2Vec2());
        return currentForwardNormal.Scale(b2Vec2.Dot(currentForwardNormal, this.m_body.GetLinearVelocity()));
    }

    public updateFriction(): void {
        // lateral linear velocity
        const impulse = this.getLateralVelocity().Scale(-1.0 * this.m_body.GetMass());
        if (impulse.Length() > this.m_maxLateralImpulse) {
            impulse.Scale(this.m_maxLateralImpulse / impulse.Length());
        }
        this.m_body.ApplyLinearImpulse(impulse.Scale(this.m_currentTraction), this.m_body.GetWorldCenter());

        // angular velocity
        this.m_body.ApplyAngularImpulse(
            this.m_currentTraction * 0.1 * this.m_body.GetInertia() * -this.m_body.GetAngularVelocity(),
        );

        // forward linear velocity
        const currentForwardNormal = this.getForwardVelocity();
        const currentForwardSpeed = currentForwardNormal.Normalize();
        const dragForceMagnitude = -2 * currentForwardSpeed;
        this.m_body.ApplyForce(
            currentForwardNormal.Scale(this.m_currentTraction * dragForceMagnitude),
            this.m_body.GetWorldCenter(),
        );
    }

    public updateDrive(controlState: number): void {
        // find desired speed
        let desiredSpeed = 0;
        switch (controlState & (TDC_UP | TDC_DOWN)) {
            case TDC_UP:
                desiredSpeed = this.m_maxForwardSpeed;
                break;
            case TDC_DOWN:
                desiredSpeed = this.m_maxBackwardSpeed;
                break;
            default:
                return; // do nothing
        }

        // find current speed in forward direction
        const currentForwardNormal = this.m_body.GetWorldVector(new b2Vec2(0, 1), new b2Vec2());
        const currentSpeed = b2Vec2.Dot(this.getForwardVelocity(), currentForwardNormal);

        // apply necessary force
        let force = 0;
        if (desiredSpeed > currentSpeed) {
            force = this.m_maxDriveForce;
        } else if (desiredSpeed < currentSpeed) {
            force = -this.m_maxDriveForce;
        } else {
            return;
        }
        this.m_body.ApplyForce(
            currentForwardNormal.Scale(this.m_currentTraction * force),
            this.m_body.GetWorldCenter(),
        );
    }

    public updateTurn(controlState: number): void {
        let desiredTorque = 0;
        switch (controlState & (TDC_LEFT | TDC_RIGHT)) {
            case TDC_LEFT:
                desiredTorque = 15;
                break;
            case TDC_RIGHT:
                desiredTorque = -15;
                break;
            default:
            // nothing
        }
        this.m_body.ApplyTorque(desiredTorque);
    }
}

export class TDCar {
    public m_tires: TDTire[];

    public m_body: b2Body;

    public flJoint: b2RevoluteJoint;

    public frJoint: b2RevoluteJoint;

    constructor(world: b2World) {
        this.m_tires = [];

        // create car body
        this.m_body = world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
        });
        this.m_body.SetAngularDamping(3);

        const vertices = [];
        vertices[0] = new b2Vec2(1.5, 0);
        vertices[1] = new b2Vec2(3, 2.5);
        vertices[2] = new b2Vec2(2.8, 5.5);
        vertices[3] = new b2Vec2(1, 10);
        vertices[4] = new b2Vec2(-1, 10);
        vertices[5] = new b2Vec2(-2.8, 5.5);
        vertices[6] = new b2Vec2(-3, 2.5);
        vertices[7] = new b2Vec2(-1.5, 0);
        const polygonShape = new b2PolygonShape();
        polygonShape.Set(vertices, 8);
        this.m_body.CreateFixture(polygonShape, 0.1); // shape, density

        // prepare common joint parameters
        const jointDef = new b2RevoluteJointDef();
        jointDef.bodyA = this.m_body;
        jointDef.enableLimit = true;
        jointDef.lowerAngle = 0;
        jointDef.upperAngle = 0;
        jointDef.localAnchorB.SetZero(); // center of tire

        const maxForwardSpeed = 250;
        const maxBackwardSpeed = -40;
        const backTireMaxDriveForce = 300;
        const frontTireMaxDriveForce = 500;
        const backTireMaxLateralImpulse = 8.5;
        const frontTireMaxLateralImpulse = 7.5;

        // back left tire
        let tire = new TDTire(world);
        tire.setCharacteristics(maxForwardSpeed, maxBackwardSpeed, backTireMaxDriveForce, backTireMaxLateralImpulse);
        jointDef.bodyB = tire.m_body;
        jointDef.localAnchorA.Set(-3, 0.75);
        world.CreateJoint(jointDef);
        this.m_tires.push(tire);

        // back right tire
        tire = new TDTire(world);
        tire.setCharacteristics(maxForwardSpeed, maxBackwardSpeed, backTireMaxDriveForce, backTireMaxLateralImpulse);
        jointDef.bodyB = tire.m_body;
        jointDef.localAnchorA.Set(3, 0.75);
        world.CreateJoint(jointDef);
        this.m_tires.push(tire);

        // front left tire
        tire = new TDTire(world);
        tire.setCharacteristics(maxForwardSpeed, maxBackwardSpeed, frontTireMaxDriveForce, frontTireMaxLateralImpulse);
        jointDef.bodyB = tire.m_body;
        jointDef.localAnchorA.Set(-3, 8.5);
        this.flJoint = world.CreateJoint(jointDef);
        this.m_tires.push(tire);

        // front right tire
        tire = new TDTire(world);
        tire.setCharacteristics(maxForwardSpeed, maxBackwardSpeed, frontTireMaxDriveForce, frontTireMaxLateralImpulse);
        jointDef.bodyB = tire.m_body;
        jointDef.localAnchorA.Set(3, 8.5);
        this.frJoint = world.CreateJoint(jointDef);
        this.m_tires.push(tire);
    }

    public update(controlState: number) {
        this.m_tires.forEach((tire) => {
            tire.updateFriction();
        });
        this.m_tires.forEach((tire) => {
            tire.updateDrive(controlState);
        });

        // control steering
        const lockAngle = 35 * DEGTORAD;
        const turnSpeedPerSec = 160 * DEGTORAD; // from lock to lock in 0.5 sec
        const turnPerTimeStep = turnSpeedPerSec / 60.0;
        let desiredAngle = 0;
        switch (controlState & (TDC_LEFT | TDC_RIGHT)) {
            case TDC_LEFT:
                desiredAngle = lockAngle;
                break;
            case TDC_RIGHT:
                desiredAngle = -lockAngle;
                break;
            default:
            // nothing
        }
        const angleNow = this.flJoint.GetJointAngle();
        let angleToTurn = desiredAngle - angleNow;
        angleToTurn = b2Clamp(angleToTurn, -turnPerTimeStep, turnPerTimeStep);
        const newAngle = angleNow + angleToTurn;
        this.flJoint.SetLimits(newAngle, newAngle);
        this.frJoint.SetLimits(newAngle, newAngle);
    }
}

export class MyDestructionListener extends DestructionListener {
    public SayGoodbyeFixture(fixture: b2Fixture): void {
        ///  if ( FixtureUserData* fud = (FixtureUserData*)fixture.GetUserData() )
        ///    delete fud;
        super.SayGoodbyeFixture(fixture);
    }

    /**
     * (unused but must implement all pure virtual functions)
     */
    public SayGoodbyeJoint(joint: b2Joint): void {
        super.SayGoodbyeJoint(joint);
    }
}

export class TopdownCar extends Test {
    public m_car: TDCar;

    public m_controlState: number;

    constructor() {
        super(b2Vec2.ZERO);

        // this.m_destructionListener = new MyDestructionListener(this);
        this.m_world.SetDestructionListener(this.m_destructionListener);

        // set up ground areas
        {
            this.m_groundBody = this.m_world.CreateBody();

            const polygonShape = new b2PolygonShape();
            const fixtureDef: b2FixtureDef = {
                shape: polygonShape,
                isSensor: true,
            };

            polygonShape.SetAsBox(9, 7, new b2Vec2(-10, 15), 20 * DEGTORAD);
            let groundAreaFixture = this.m_groundBody.CreateFixture(fixtureDef);
            groundAreaFixture.SetUserData(new GroundAreaFUD(0.5, false));

            polygonShape.SetAsBox(9, 5, new b2Vec2(5, 20), -40 * DEGTORAD);
            groundAreaFixture = this.m_groundBody.CreateFixture(fixtureDef);
            groundAreaFixture.SetUserData(new GroundAreaFUD(0.2, false));
        }

        // this.m_tire = new TDTire(this.m_world);
        // this.m_tire.setCharacteristics(100, -20, 150);

        this.m_car = new TDCar(this.m_world);

        this.m_controlState = 0;
    }

    getHotkeys(): HotKey[] {
        return [
            hotKey([], "a", "Turn Left", (down) => this.SetControlState(TDC_LEFT, down)),
            hotKey([], "d", "Turn Right", (down) => this.SetControlState(TDC_RIGHT, down)),
            hotKey([], "w", "Move Forward", (down) => this.SetControlState(TDC_UP, down)),
            hotKey([], "s", "Move Backward", (down) => this.SetControlState(TDC_DOWN, down)),
        ];
    }

    private SetControlState(bit: number, down: boolean) {
        if (down) this.m_controlState |= bit;
        else this.m_controlState &= ~bit;
    }

    public static handleContact(contact: b2Contact, began: boolean): void {
        const a = contact.GetFixtureA();
        const b = contact.GetFixtureB();
        const fudA = a.GetUserData();
        const fudB = b.GetUserData();

        if (!fudA || !fudB) {
            return;
        }

        if (fudA.getType() === FUD_CAR_TIRE || fudB.getType() === FUD_GROUND_AREA) {
            TopdownCar.tire_vs_groundArea(a, b, began);
        } else if (fudA.getType() === FUD_GROUND_AREA || fudB.getType() === FUD_CAR_TIRE) {
            TopdownCar.tire_vs_groundArea(b, a, began);
        }
    }

    public BeginContact(contact: b2Contact): void {
        TopdownCar.handleContact(contact, true);
    }

    public EndContact(contact: b2Contact): void {
        TopdownCar.handleContact(contact, false);
    }

    public static tire_vs_groundArea(tireFixture: b2Fixture, groundAreaFixture: b2Fixture, began: boolean): void {
        const tire = tireFixture.GetBody().GetUserData();
        const gaFud = groundAreaFixture.GetUserData();
        if (began) {
            tire.addGroundArea(gaFud);
        } else {
            tire.removeGroundArea(gaFud);
        }
    }

    public Step(settings: Settings, timeStep: number): void {
        /* this.m_tire.updateFriction();
    this.m_tire.updateDrive(this.m_controlState);
    this.m_tire.updateTurn(this.m_controlState); */

        this.m_car.update(this.m_controlState);

        super.Step(settings, timeStep);
    }
}
