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

import { b2PrismaticJoint, b2EdgeShape, b2Vec2, b2PolygonShape, b2BodyType, b2PrismaticJointDef } from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";

export class Prismatic extends Test {
    public m_joint: b2PrismaticJoint;

    constructor() {
        super();

        let ground = null;

        {
            ground = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        {
            const shape = new b2PolygonShape();
            shape.SetAsBox(2.0, 0.5);

            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: -10.0, y: 10.0 },
                angle: 0.5 * Math.PI,
                allowSleep: false,
            });
            body.CreateFixture(shape, 5.0);

            const pjd = new b2PrismaticJointDef();

            // Bouncy limit
            const axis = new b2Vec2(2.0, 1.0);
            axis.Normalize();
            pjd.Initialize(ground, body, new b2Vec2(0.0, 0.0), axis);

            // Non-bouncy limit
            // pjd.Initialize(ground, body, new b2Vec2(-10.0, 10.0), new b2Vec2(1.0, 0.0));

            pjd.motorSpeed = 10.0;
            pjd.maxMotorForce = 10000.0;
            pjd.enableMotor = true;
            pjd.lowerTranslation = 0.0;
            pjd.upperTranslation = 20.0;
            pjd.enableLimit = true;

            this.m_joint = this.m_world.CreateJoint(pjd);
        }
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "l", "Toggle Limit", () => this.m_joint.EnableLimit(!this.m_joint.IsLimitEnabled())),
            hotKeyPress([], "m", "Start/Stop", () => this.m_joint.EnableMotor(!this.m_joint.IsMotorEnabled())),
            hotKeyPress([], "s", "Reverse Direction", () => this.m_joint.SetMotorSpeed(-this.m_joint.GetMotorSpeed())),
        ];
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);
        const force = this.m_joint.GetMotorForce(settings.m_hertz);
        this.addDebug("Motor Force", force.toFixed(4));
    }
}
