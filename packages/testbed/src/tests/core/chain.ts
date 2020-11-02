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

import { b2EdgeShape, b2Vec2, b2PolygonShape, b2FixtureDef, b2RevoluteJointDef, b2BodyType } from "@plane2d/core";

import { Test } from "../../test";

const TEST_BAD_BODY = false;

export class Chain extends Test {
    public static readonly e_count = 30;

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
            shape.SetAsBox(0.6, 0.125);

            const fd: b2FixtureDef = {
                shape,
                density: 20.0,
                friction: 0.2,
            };

            const jd = new b2RevoluteJointDef();
            jd.collideConnected = false;

            const y = 25.0;
            let prevBody = ground;
            for (let i = 0; i < Chain.e_count; ++i) {
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: 0.5 + i, y },
                });

                if (TEST_BAD_BODY) {
                    if (i === 10) {
                        fd.density = 0.0;
                    } else {
                        fd.density = 20.0;
                    }
                }

                body.CreateFixture(fd);

                const anchor = new b2Vec2(i, y);
                jd.Initialize(prevBody, body, anchor);
                this.m_world.CreateJoint(jd);

                prevBody = body;
            }
        }
    }
}
