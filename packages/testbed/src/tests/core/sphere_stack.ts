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

import { b2Body, b2EdgeShape, b2Vec2, b2CircleShape, b2BodyType } from "@plane2d/core";

import { Test } from "../../test";

export class SphereStack extends Test {
    public static readonly e_count: number = 10;

    public m_bodies: b2Body[] = [];

    constructor() {
        super();

        {
            const ground: b2Body = this.m_world.CreateBody();

            const shape: b2EdgeShape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        {
            const shape: b2CircleShape = new b2CircleShape();
            shape.m_radius = 1.0;

            for (let i = 0; i < SphereStack.e_count; ++i) {
                this.m_bodies[i] = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: 0.0, y: 4.0 + 3.0 * i },
                });

                this.m_bodies[i].CreateFixture(shape, 1.0);

                this.m_bodies[i].SetLinearVelocity(new b2Vec2(0.0, -50.0));
            }
        }
    }
}
