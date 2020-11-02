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
    b2FixtureDef,
    b2PolygonShape,
    b2BodyType,
    b2PrismaticJointDef,
    b2CircleShape,
    b2Filter,
} from "@plane2d/core";

import { Test } from "../../test";

export class CollisionFiltering extends Test {
    public static readonly k_smallGroup = 1;

    public static readonly k_largeGroup = -1;

    public static readonly k_triangleCategory = 0x0002;

    public static readonly k_boxCategory = 0x0004;

    public static readonly k_circleCategory = 0x0008;

    public static readonly k_triangleMask = 0xffff;

    public static readonly k_boxMask = 0xffff ^ CollisionFiltering.k_triangleCategory;

    public static readonly k_circleMask = 0xffff;

    constructor() {
        super();

        // Ground body
        {
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));

            const ground = this.m_world.CreateBody();
            ground.CreateFixture({
                shape,
                friction: 0.3,
            });
        }

        // Small triangle
        const vertices = [];
        vertices[0] = new b2Vec2(-1.0, 0.0);
        vertices[1] = new b2Vec2(1.0, 0.0);
        vertices[2] = new b2Vec2(0.0, 2.0);
        const polygon = new b2PolygonShape();
        polygon.Set(vertices, 3);

        const triangleFilter: b2Filter = {
            groupIndex: CollisionFiltering.k_smallGroup,
            categoryBits: CollisionFiltering.k_triangleCategory,
            maskBits: CollisionFiltering.k_triangleMask,
        };
        const triangleShapeDef: b2FixtureDef = {
            shape: polygon,
            density: 1.0,
            filter: triangleFilter,
        };

        const body1 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position: {
                x: -5.0,
                y: 2.0,
            },
        });
        body1.CreateFixture(triangleShapeDef);

        // Large triangle (recycle definitions)
        vertices[0].Scale(2.0);
        vertices[1].Scale(2.0);
        vertices[2].Scale(2.0);
        polygon.Set(vertices, 3);
        triangleFilter.groupIndex = CollisionFiltering.k_largeGroup;

        const body2 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            fixedRotation: true, // look at me!
            position: {
                x: -5.0,
                y: 6.0,
            },
        });
        body2.CreateFixture(triangleShapeDef);

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: -5.0, y: 10.0 },
            });

            const p = new b2PolygonShape();
            p.SetAsBox(0.5, 1.0);
            body.CreateFixture(p, 1.0);

            const jd = new b2PrismaticJointDef();
            jd.bodyA = body2;
            jd.bodyB = body;
            jd.enableLimit = true;
            jd.localAnchorA.Set(0.0, 4.0);
            jd.localAnchorB.SetZero();
            jd.localAxisA.Set(0.0, 1.0);
            jd.lowerTranslation = -1.0;
            jd.upperTranslation = 1.0;

            this.m_world.CreateJoint(jd);
        }

        // Small box
        polygon.SetAsBox(1.0, 0.5);
        const boxFilter: b2Filter = {
            groupIndex: CollisionFiltering.k_smallGroup,
            categoryBits: CollisionFiltering.k_boxCategory,
            maskBits: CollisionFiltering.k_boxMask,
        };
        const boxShapeDef: b2FixtureDef = {
            shape: polygon,
            density: 1.0,
            restitution: 0.1,
            filter: boxFilter,
        };

        const body3 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position: { x: 0.0, y: 2.0 },
        });
        body3.CreateFixture(boxShapeDef);

        // Large box (recycle definitions)
        polygon.SetAsBox(2.0, 1.0);
        boxFilter.groupIndex = CollisionFiltering.k_largeGroup;

        const body4 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position: { x: 0.0, y: 6.0 },
        });
        body4.CreateFixture(boxShapeDef);

        // Small circle
        const circle = new b2CircleShape();
        circle.m_radius = 1.0;

        const circleFilter: b2Filter = {
            groupIndex: CollisionFiltering.k_smallGroup,
            categoryBits: CollisionFiltering.k_circleCategory,
            maskBits: CollisionFiltering.k_circleMask,
        };
        const circleShapeDef: b2FixtureDef = {
            shape: circle,
            density: 1.0,
            filter: circleFilter,
        };

        const body5 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position: { x: 5.0, y: 2.0 },
        });
        body5.CreateFixture(circleShapeDef);

        // Large circle
        circle.m_radius *= 2.0;
        circleFilter.groupIndex = CollisionFiltering.k_largeGroup;

        const body6 = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position: { x: 5.0, y: 6.0 },
        });
        body6.CreateFixture(circleShapeDef);
    }
}
