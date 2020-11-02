/*
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
    b2RevoluteJoint,
    b2EdgeShape,
    b2Vec2,
    b2CircleShape,
    b2BodyType,
    b2RevoluteJointDef,
    b2PolygonShape,
    XY,
} from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";

export class Revolute extends Test {
    public m_ball: b2Body;

    public m_joint: b2RevoluteJoint;

    constructor() {
        super();

        let ground = null;

        {
            ground = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));

            ground.CreateFixture({
                shape,
                // filter.categoryBits = 2;
            });
        }

        {
            const shape = new b2CircleShape();
            shape.m_radius = 0.5;

            const rjd = new b2RevoluteJointDef();

            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,

                position: { x: -10.0, y: 20.0 },
            });
            body.CreateFixture(shape, 5.0);

            const w = 100.0;
            body.SetAngularVelocity(w);
            body.SetLinearVelocity(new b2Vec2(-8.0 * w, 0.0));

            rjd.Initialize(ground, body, new b2Vec2(-10.0, 12.0));
            rjd.motorSpeed = 1.0 * Math.PI;
            rjd.maxMotorTorque = 10000.0;
            rjd.enableMotor = false;
            rjd.lowerAngle = -0.25 * Math.PI;
            rjd.upperAngle = 0.5 * Math.PI;
            rjd.enableLimit = true;
            rjd.collideConnected = true;

            this.m_joint = this.m_world.CreateJoint(rjd);
        }

        {
            /* b2CircleShape */
            const circle_shape = new b2CircleShape();
            circle_shape.m_radius = 3.0;

            this.m_ball = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 5.0, y: 30.0 },
            });
            this.m_ball.CreateFixture({
                density: 5.0,
                filter: {
                    maskBits: 1,
                },
                shape: circle_shape,
            });

            /* b2PolygonShape */
            const polygon_shape = new b2PolygonShape();
            polygon_shape.SetAsBox(10.0, 0.2, new b2Vec2(-10.0, 0.0), 0.0);

            /* b2Body */
            const polygon_body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 20.0, y: 10.0 },
                bullet: true,
            });
            polygon_body.CreateFixture(polygon_shape, 2.0);

            const rjd = new b2RevoluteJointDef();
            rjd.Initialize(ground, polygon_body, new b2Vec2(20.0, 10.0));
            rjd.lowerAngle = -0.25 * Math.PI;
            rjd.upperAngle = 0.0 * Math.PI;
            rjd.enableLimit = true;
            this.m_world.CreateJoint(rjd);
        }

        // Tests mass computation of a small object far from the origin
        {
            /* b2Body */
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });

            /* b2PolygonShape */
            const polyShape = new b2PolygonShape();
            /* b2Vec2 */
            const verts = b2Vec2.MakeArray(3);
            verts[0].Set(17.63, 36.31);
            verts[1].Set(17.52, 36.69);
            verts[2].Set(17.19, 36.36);
            polyShape.Set(verts, 3);

            body.CreateFixture({
                shape: polyShape,
                density: 1,
            }); // assertion hits inside here
        }
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 5,
        };
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "l", "Toggle Limit", () => this.m_joint.EnableLimit(!this.m_joint.IsLimitEnabled())),
            hotKeyPress([], "m", "Start/Stop", () => this.m_joint.EnableMotor(!this.m_joint.IsMotorEnabled())),
        ];
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);

        // if (this.m_stepCount === 360) {
        //   this.m_ball.SetTransformVec(new b2Vec2(0.0, 0.5), 0.0);
        // }

        // const torque1 = this.m_joint.GetMotorTorque(settings.hz);
        // this.addDebug("Motor Torque", `${torque1.toFixed(0)}, ${torque2.toFixed(0)}`);
        // this.addDebug("Motor Force", `${force3.toFixed(0)}`);
    }
}
