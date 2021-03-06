/*
 * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
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

import { b2PolygonShape, b2BodyType, b2RevoluteJointDef, b2Vec2, b2PrismaticJointDef, XY } from "@box2d/core";

import { Test } from "../../test";

export class BasicSliderCrank extends Test {
    constructor() {
        super();

        /* b2Body */
        const ground = this.m_world.CreateBody({
            position: {
                x: 0,
                y: 17,
            },
        });

        {
            /* b2Body */
            let prevBody = ground;

            // Define crank.
            {
                /* b2PolygonShape */
                const shape = new b2PolygonShape();
                shape.SetAsBox(4.0, 1.0);

                /* b2Body */
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: {
                        x: -8,
                        y: 20,
                    },
                });
                body.CreateFixture(shape, 2.0);

                /* b2RevoluteJointDef */
                const rjd = new b2RevoluteJointDef();
                rjd.Initialize(prevBody, body, new b2Vec2(-12.0, 20.0));
                this.m_world.CreateJoint(rjd);

                prevBody = body;
            }

            // Define connecting rod
            {
                /* b2PolygonShape */
                const shape = new b2PolygonShape();
                shape.SetAsBox(8.0, 1.0);

                /* b2Body */
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: {
                        x: 4.0,
                        y: 20.0,
                    },
                });
                body.CreateFixture(shape, 2.0);

                /* b2RevoluteJointDef */
                const rjd = new b2RevoluteJointDef();
                rjd.Initialize(prevBody, body, new b2Vec2(-4.0, 20.0));
                this.m_world.CreateJoint(rjd);

                prevBody = body;
            }

            // Define piston
            {
                /* b2PolygonShape */
                const shape = new b2PolygonShape();
                shape.SetAsBox(3.0, 3.0);

                /* b2Body */
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    fixedRotation: true,
                    position: {
                        x: 12,
                        y: 20,
                    },
                });
                body.CreateFixture(shape, 2.0);

                /* b2RevoluteJointDef */
                const rjd = new b2RevoluteJointDef();
                rjd.Initialize(prevBody, body, new b2Vec2(12.0, 20.0));
                this.m_world.CreateJoint(rjd);

                /* b2PrismaticJointDef */
                const pjd = new b2PrismaticJointDef();
                pjd.Initialize(ground, body, new b2Vec2(12.0, 17.0), new b2Vec2(1.0, 0.0));
                this.m_world.CreateJoint(pjd);
            }
        }
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 15,
        };
    }
}
