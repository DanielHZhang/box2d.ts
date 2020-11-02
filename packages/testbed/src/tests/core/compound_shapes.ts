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
    b2EdgeShape,
    b2Vec2,
    b2CircleShape,
    b2RandomRange,
    b2BodyType,
    b2PolygonShape,
    b2Transform,
    b2Rot,
    XY,
} from "@plane2d/core";

import { Test } from "../../test";

export class CompoundShapes extends Test {
    constructor() {
        super();

        {
            const body = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(50.0, 0.0), new b2Vec2(-50.0, 0.0));

            body.CreateFixture(shape, 0.0);
        }

        {
            const circle1 = new b2CircleShape();
            circle1.m_radius = 0.5;
            circle1.m_p.Set(-0.5, 0.5);

            const circle2 = new b2CircleShape();
            circle2.m_radius = 0.5;
            circle2.m_p.Set(0.5, 0.5);

            for (let i = 0; i < 10; ++i) {
                const x = b2RandomRange(-0.1, 0.1);
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    angle: b2RandomRange(-Math.PI, Math.PI),
                    position: {
                        x: x + 5.0,
                        y: 1.05 + 2.5 * i,
                    },
                });
                body.CreateFixture(circle1, 2.0);
                body.CreateFixture(circle2, 0.0);
            }
        }

        {
            const polygon1 = new b2PolygonShape();
            polygon1.SetAsBox(0.25, 0.5);

            const polygon2 = new b2PolygonShape();
            polygon2.SetAsBox(0.25, 0.5, new b2Vec2(0.0, -0.5), 0.5 * Math.PI);

            for (let i = 0; i < 10; ++i) {
                const x = b2RandomRange(-0.1, 0.1);
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    angle: b2RandomRange(-Math.PI, Math.PI),
                    position: { x: x - 5.0, y: 1.05 + 2.5 * i },
                });
                body.CreateFixture(polygon1, 2.0);
                body.CreateFixture(polygon2, 2.0);
            }
        }

        {
            const xf1 = new b2Transform();
            xf1.q.Set(0.3524 * Math.PI);
            xf1.p.Copy(b2Rot.MultiplyVec2(xf1.q, new b2Vec2(1.0, 0.0), new b2Vec2()));

            const vertices = [];

            const triangle1 = new b2PolygonShape();
            vertices[0] = b2Transform.MultiplyVec2(xf1, new b2Vec2(-1.0, 0.0), new b2Vec2());
            vertices[1] = b2Transform.MultiplyVec2(xf1, new b2Vec2(1.0, 0.0), new b2Vec2());
            vertices[2] = b2Transform.MultiplyVec2(xf1, new b2Vec2(0.0, 0.5), new b2Vec2());
            triangle1.Set(vertices, 3);

            const xf2 = new b2Transform();
            xf2.q.Set(-0.3524 * Math.PI);
            xf2.p.Copy(b2Rot.MultiplyVec2(xf2.q, new b2Vec2(-1.0, 0.0), new b2Vec2()));

            const triangle2 = new b2PolygonShape();
            vertices[0] = b2Transform.MultiplyVec2(xf2, new b2Vec2(-1.0, 0.0), new b2Vec2());
            vertices[1] = b2Transform.MultiplyVec2(xf2, new b2Vec2(1.0, 0.0), new b2Vec2());
            vertices[2] = b2Transform.MultiplyVec2(xf2, new b2Vec2(0.0, 0.5), new b2Vec2());
            triangle2.Set(vertices, 3);

            for (let i = 0; i < 10; ++i) {
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: b2RandomRange(-0.1, 0.1), y: 2.05 + 2.5 * i },
                    angle: 0,
                });
                body.CreateFixture(triangle1, 2.0);
                body.CreateFixture(triangle2, 2.0);
            }
        }

        {
            const bottom = new b2PolygonShape();
            bottom.SetAsBox(1.5, 0.15);

            const left = new b2PolygonShape();
            left.SetAsBox(0.15, 2.7, new b2Vec2(-1.45, 2.35), 0.2);

            const right = new b2PolygonShape();
            right.SetAsBox(0.15, 2.7, new b2Vec2(1.45, 2.35), -0.2);

            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 0.0, y: 2.0 },
            });
            body.CreateFixture(bottom, 4.0);
            body.CreateFixture(left, 4.0);
            body.CreateFixture(right, 4.0);
        }
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 5,
        };
    }
}
