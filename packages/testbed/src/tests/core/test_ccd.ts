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
    b2BodyDef,
    b2Vec2,
    b2ChainShape,
    b2FixtureDef,
    b2BodyType,
    b2PolygonShape,
    b2CircleShape,
    XY,
} from "@box2d/core";

import { Test } from "../../test";

export class TestCCD extends Test {
    constructor() {
        super();

        {
            const bd = new b2BodyDef();
            const ground = this.m_world.CreateBody(bd);

            const shape = new b2ChainShape();
            shape.CreateLoop([
                new b2Vec2(-30.0, 0.0),
                new b2Vec2(-30.0, 40.0),
                new b2Vec2(30.0, 40.0),
                new b2Vec2(30.0, 0.0),
            ]);
            ground.CreateFixture(shape, 0.0);
        }

        // Always on, even if default is off
        this.m_world.SetContinuousPhysics(true);

        const fd = new b2FixtureDef();
        // These values are used for all the parts of the 'basket'
        fd.density = 4.0;
        fd.restitution = 1.4;

        // Create 'basket'
        {
            const bd = new b2BodyDef();
            bd.type = b2BodyType.b2_dynamicBody;
            bd.bullet = true;
            bd.position.Set(15.0, 5.0);
            const body = this.m_world.CreateBody(bd);

            const sd_bottom = new b2PolygonShape();
            sd_bottom.SetAsBox(4.5, 0.45);
            fd.shape = sd_bottom;
            body.CreateFixture(fd);

            const sd_left = new b2PolygonShape();
            sd_left.SetAsBox(0.45, 8.1, new b2Vec2(-4.35, 7.05), 0.2);
            fd.shape = sd_left;
            body.CreateFixture(fd);

            const sd_right = new b2PolygonShape();
            sd_right.SetAsBox(0.45, 8.1, new b2Vec2(4.35, 7.05), -0.2);
            fd.shape = sd_right;
            body.CreateFixture(fd);
        }

        // add some small circles for effect
        for (let i = 0; i < 5; i++) {
            const cd = new b2CircleShape(Math.random() * 1.0 + 0.5);
            fd.shape = cd;
            fd.friction = 0.3;
            fd.density = 1.0;
            fd.restitution = 1.1;
            const bd = new b2BodyDef();
            bd.type = b2BodyType.b2_dynamicBody;
            bd.bullet = true;
            bd.position.Set(Math.random() * 30.0 - 25.0, Math.random() * 32.0 + 2.0);
            const body = this.m_world.CreateBody(bd);
            body.CreateFixture(fd);
        }
    }

    public GetDefaultViewZoom() {
        return 20;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 15,
        };
    }
}