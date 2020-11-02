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
    b2RopeJointDef,
    b2RopeJoint,
    b2BodyDef,
    b2EdgeShape,
    b2Vec2,
    b2PolygonShape,
    b2FixtureDef,
    b2RevoluteJointDef,
    b2BodyType,
} from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";

export class RopeJoint extends Test {
    public m_ropeDef = new b2RopeJointDef();

    public m_rope: b2RopeJoint | null = null;

    constructor() {
        super();

        /* b2Body */
        let ground = null;
        {
            ground = this.m_world.CreateBody();

            /* b2EdgeShape */
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        {
            /* b2PolygonShape */
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.5, 0.125);

            const filter = {
                categoryBits: 0x0001,
                maskBits: 0xffff & ~0x0002,
            };
            const fd: b2FixtureDef = {
                shape,
                density: 20.0,
                friction: 0.2,
                filter,
            };

            /* b2RevoluteJointDef */
            const jd = new b2RevoluteJointDef();
            jd.collideConnected = false;

            /* const int32 */
            const N = 10;
            /* const float32 */
            const y = 15.0;
            this.m_ropeDef.localAnchorA.Set(0.0, y);

            /* b2Body */
            let prevBody = ground;
            for (/* int32 */ let i = 0; i < N; ++i) {
                const bd: b2BodyDef = {
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: 0.5 + 1.0 * i, y },
                };
                if (i === N - 1) {
                    shape.SetAsBox(1.5, 1.5);
                    fd.density = 100.0;
                    filter.categoryBits = 0x0002;
                    bd.position = { x: 1.0 * i, y };
                    bd.angularDamping = 0.4;
                }

                /* b2Body */
                const body = this.m_world.CreateBody(bd);

                body.CreateFixture(fd);

                /* b2Vec2 */
                const anchor = new b2Vec2(i, y);
                jd.Initialize(prevBody, body, anchor);
                this.m_world.CreateJoint(jd);

                prevBody = body;
            }

            this.m_ropeDef.localAnchorB.SetZero();

            /* float32 */
            const extraLength = 0.01;
            this.m_ropeDef.maxLength = N - 1.0 + extraLength;
            this.m_ropeDef.bodyB = prevBody;
        }

        this.m_ropeDef.bodyA = ground;
        this.m_rope = this.m_world.CreateJoint(this.m_ropeDef) as b2RopeJoint;
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "j", "Toggle Rope Joint", () => {
                if (this.m_rope) {
                    this.m_world.DestroyJoint(this.m_rope);
                    this.m_rope = null;
                } else {
                    this.m_rope = this.m_world.CreateJoint(this.m_ropeDef) as b2RopeJoint;
                }
            }),
        ];
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);
        this.addDebug("Rope", this.m_rope ? "ON" : "OFF");
    }
}
