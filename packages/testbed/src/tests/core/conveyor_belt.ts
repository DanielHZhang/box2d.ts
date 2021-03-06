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

import { b2Fixture, b2EdgeShape, b2Vec2, b2PolygonShape, b2BodyType, b2Contact, b2Manifold } from "@box2d/core";

import { Test } from "../../test";

export class ConveyorBelt extends Test {
    public m_platform: b2Fixture;

    constructor() {
        super();

        // Ground
        {
            /* b2Body */
            const ground = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-20.0, 0.0), new b2Vec2(20.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        // Platform
        {
            /* b2Body */
            const body = this.m_world.CreateBody({
                position: { x: -5.0, y: 5.0 },
            });

            const shape = new b2PolygonShape();
            shape.SetAsBox(10.0, 0.5);

            this.m_platform = body.CreateFixture({
                shape,
                friction: 0.8,
            });
        }

        // Boxes
        for (/* int */ let i = 0; i < 5; ++i) {
            /* b2Body */
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: -10.0 + 2.0 * i, y: 7.0 },
            });

            const shape = new b2PolygonShape();
            shape.SetAsBox(0.5, 0.5);
            body.CreateFixture(shape, 20.0);
        }
    }

    public GetDefaultViewZoom() {
        return 40;
    }

    public PreSolve(contact: b2Contact, oldManifold: b2Manifold) {
        super.PreSolve(contact, oldManifold);

        /* b2Fixture */
        const fixtureA = contact.GetFixtureA();
        /* b2Fixture */
        const fixtureB = contact.GetFixtureB();

        if (fixtureA === this.m_platform) {
            contact.SetTangentSpeed(5.0);
        }

        if (fixtureB === this.m_platform) {
            contact.SetTangentSpeed(-5.0);
        }
    }
}
