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
    b2EdgeShape,
    b2Vec2,
    b2BodyType,
    b2PolygonShape,
    b2RevoluteJointDef,
    b2PrismaticJointDef,
} from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { hotKeyPress, HotKey } from "../../utils/hotkeys";

export class BodyTypes extends Test {
    public m_attachment: b2Body;

    public m_platform: b2Body;

    public m_speed = 0;

    constructor() {
        super();

        const ground = this.m_world.CreateBody();

        /* b2EdgeShape */
        const gshape = new b2EdgeShape();
        gshape.SetTwoSided(new b2Vec2(-20.0, 0.0), new b2Vec2(20.0, 0.0));

        ground.CreateFixture({ shape: gshape });

        // Define attachment
        {
            this.m_attachment = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: {
                    x: 0.0,
                    y: 3.0,
                },
            });

            /* b2PolygonShape */
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.5, 2.0);
            this.m_attachment.CreateFixture(shape, 2.0);
        }

        // Define platform
        {
            this.m_platform = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: -4.0, y: 5.0 },
            });

            /* b2PolygonShape */
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.5, 4.0, new b2Vec2(4.0, 0.0), 0.5 * Math.PI);

            this.m_platform.CreateFixture({
                shape,
                friction: 0.6,
                density: 2.0,
            });

            /* b2RevoluteJointDef */
            const rjd = new b2RevoluteJointDef();
            rjd.Initialize(this.m_attachment, this.m_platform, new b2Vec2(0.0, 5.0));
            rjd.maxMotorTorque = 50.0;
            rjd.enableMotor = true;
            this.m_world.CreateJoint(rjd);

            /* b2PrismaticJointDef */
            const pjd = new b2PrismaticJointDef();
            pjd.Initialize(ground, this.m_platform, new b2Vec2(0.0, 5.0), new b2Vec2(1.0, 0.0));

            pjd.maxMotorForce = 1000.0;
            pjd.enableMotor = true;
            pjd.lowerTranslation = -10.0;
            pjd.upperTranslation = 10.0;
            pjd.enableLimit = true;

            this.m_world.CreateJoint(pjd);

            this.m_speed = 3.0;
        }

        // Create a payload
        {
            /* b2Body */
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 0.0, y: 8.0 },
            });

            /* b2PolygonShape */
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.75, 0.75);

            body.CreateFixture({
                shape,
                friction: 0.6,
                density: 2.0,
            });
        }
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "d", "Set Dynamic Body", () => this.m_platform.SetType(b2BodyType.b2_dynamicBody)),
            hotKeyPress([], "s", "Set Static Body", () => this.m_platform.SetType(b2BodyType.b2_staticBody)),
            hotKeyPress([], "k", "Set Kinematic Body", () => {
                this.m_platform.SetType(b2BodyType.b2_kinematicBody);
                this.m_platform.SetLinearVelocity(new b2Vec2(-this.m_speed, 0.0));
                this.m_platform.SetAngularVelocity(0.0);
            }),
        ];
    }

    public Step(settings: Settings, timeStep: number): void {
        // Drive the kinematic body.
        if (this.m_platform.GetType() === b2BodyType.b2_kinematicBody) {
            /* b2Vec2 */
            const { p } = this.m_platform.GetTransform();
            /* b2Vec2 */
            const v = this.m_platform.GetLinearVelocity();

            if ((p.x < -10.0 && v.x < 0.0) || (p.x > 10.0 && v.x > 0.0)) {
                this.m_platform.SetLinearVelocity(new b2Vec2(-v.x, v.y));
            }
        }

        super.Step(settings, timeStep);
    }
}
