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
    b2Fixture,
    b2Body,
    b2EdgeShape,
    b2Vec2,
    b2CircleShape,
    b2BodyType,
    b2Contact,
    b2_epsilon_sq,
    XY,
} from "@box2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";

export class SensorTest extends Test {
    public static readonly e_count = 7;

    public m_sensor: b2Fixture;

    public m_bodies: b2Body[];

    public m_touching: boolean[][];

    constructor() {
        super();

        this.m_bodies = new Array(SensorTest.e_count);
        this.m_touching = new Array(SensorTest.e_count);
        for (let i = 0; i < SensorTest.e_count; ++i) {
            this.m_touching[i] = new Array(1);
        }

        const ground = this.m_world.CreateBody();

        {
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        /*
    {
      const sd = new b2FixtureDef();
      sd.SetAsBox(10.0, 2.0, new b2Vec2(0.0, 20.0), 0.0);
      sd.isSensor = true;
      this.m_sensor = ground.CreateFixture(sd);
    }
    */
        {
            const shape = new b2CircleShape();
            shape.m_radius = 5.0;
            shape.m_p.Set(0.0, 10.0);

            this.m_sensor = ground.CreateFixture({
                shape,
                isSensor: true,
            });
        }

        {
            const shape = new b2CircleShape();
            shape.m_radius = 1.0;

            for (let i = 0; i < SensorTest.e_count; ++i) {
                this.m_touching[i][0] = false;
                this.m_bodies[i] = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: -10.0 + 3.0 * i, y: 20.0 },
                    userData: this.m_touching[i],
                });

                this.m_bodies[i].CreateFixture(shape, 1.0);
            }
        }
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 5,
        };
    }

    public BeginContact(contact: b2Contact) {
        const fixtureA = contact.GetFixtureA();
        const fixtureB = contact.GetFixtureB();

        if (fixtureA === this.m_sensor) {
            const userData = fixtureB.GetBody().GetUserData();
            if (userData) {
                const touching = userData;
                touching[0] = true;
            }
        }

        if (fixtureB === this.m_sensor) {
            const userData = fixtureA.GetBody().GetUserData();
            if (userData) {
                const touching = userData;
                touching[0] = true;
            }
        }
    }

    public EndContact(contact: b2Contact) {
        const fixtureA = contact.GetFixtureA();
        const fixtureB = contact.GetFixtureB();

        if (fixtureA === this.m_sensor) {
            const userData = fixtureB.GetBody().GetUserData();
            if (userData) {
                const touching = userData;
                touching[0] = false;
            }
        }

        if (fixtureB === this.m_sensor) {
            const userData = fixtureA.GetBody().GetUserData();
            if (userData) {
                const touching = userData;
                touching[0] = false;
            }
        }
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);

        // Traverse the contact results. Apply a force on shapes
        // that overlap the sensor.
        for (let i = 0; i < SensorTest.e_count; ++i) {
            if (!this.m_touching[i][0]) {
                continue;
            }

            const body = this.m_bodies[i];
            const ground = this.m_sensor.GetBody();

            const circle = this.m_sensor.GetShape() as b2CircleShape;
            const center = ground.GetWorldPoint(circle.m_p, new b2Vec2());

            const position = body.GetPosition();

            const d = b2Vec2.Subtract(center, position, new b2Vec2());
            if (d.LengthSquared() < b2_epsilon_sq) {
                continue;
            }

            d.Normalize();
            const F = b2Vec2.Scale(100.0, d, new b2Vec2());
            body.ApplyForce(F, position);
        }
    }
}
