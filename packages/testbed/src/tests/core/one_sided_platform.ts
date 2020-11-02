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
    b2EdgeShape,
    b2Vec2,
    b2PolygonShape,
    b2BodyType,
    b2CircleShape,
    b2Contact,
    b2Manifold,
    b2_linearSlop,
    XY,
} from "@plane2d/core";

import { Test } from "../../test";

export enum OneSidedPlatform_State {
    e_unknown = 0,
    e_above = 1,
    e_below = 2,
}

export class OneSidedPlatform extends Test {
    public m_radius = 0.0;

    public m_top = 0.0;

    public m_bottom = 0.0;

    public m_state = OneSidedPlatform_State.e_unknown;

    public m_platform: b2Fixture;

    public m_character: b2Fixture;

    constructor() {
        super();

        // Ground
        {
            const ground = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
        }

        // Platform
        {
            const body = this.m_world.CreateBody({
                position: { x: 0.0, y: 10.0 },
            });

            const shape = new b2PolygonShape();
            shape.SetAsBox(3.0, 0.5);
            this.m_platform = body.CreateFixture(shape, 0.0);

            this.m_bottom = 10.0 - 0.5;
            this.m_top = 10.0 + 0.5;
        }

        // Actor
        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 0.0, y: 12.0 },
            });

            this.m_radius = 0.5;
            const shape = new b2CircleShape();
            shape.m_radius = this.m_radius;
            this.m_character = body.CreateFixture(shape, 20.0);

            body.SetLinearVelocity(new b2Vec2(0.0, -50.0));

            this.m_state = OneSidedPlatform_State.e_unknown;
        }
    }

    public GetDefaultViewZoom() {
        return 40;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 5,
        };
    }

    public PreSolve(contact: b2Contact, oldManifold: b2Manifold) {
        super.PreSolve(contact, oldManifold);

        const fixtureA = contact.GetFixtureA();
        const fixtureB = contact.GetFixtureB();

        if (fixtureA !== this.m_platform && fixtureA !== this.m_character) {
            return;
        }

        if (fixtureB !== this.m_platform && fixtureB !== this.m_character) {
            return;
        }

        const position = this.m_character.GetBody().GetPosition();

        if (position.y < this.m_top + this.m_radius - 3.0 * b2_linearSlop) {
            contact.SetEnabled(false);
        }
    }
}
