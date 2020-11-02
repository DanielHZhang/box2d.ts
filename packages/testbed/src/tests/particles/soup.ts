/*
 * Copyright (c) 2013 Google, Inc.
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

import { b2Body, b2PolygonShape, b2Vec2, b2BodyType, b2CircleShape, b2EdgeShape, b2MassData, XY } from "@plane2d/core";
import { b2ParticleFlag, b2ParticleGroupDef } from "@plane2d/particles";

import { Test } from "../../test";

export class Soup extends Test {
    public m_ground: b2Body;

    constructor() {
        super();

        // Disable the selection of wall and barrier particles for this test.
        this.InitializeParticleParameters(b2ParticleFlag.b2_wallParticle | b2ParticleFlag.b2_barrierParticle);

        this.m_ground = this.m_world.CreateBody();

        {
            const shape = new b2PolygonShape();
            const vertices = [new b2Vec2(-4, -1), new b2Vec2(4, -1), new b2Vec2(4, 0), new b2Vec2(-4, 0)];
            shape.Set(vertices, 4);
            this.m_ground.CreateFixture(shape, 0.0);
        }

        {
            const shape = new b2PolygonShape();
            const vertices = [new b2Vec2(-4, -0.1), new b2Vec2(-2, -0.1), new b2Vec2(-2, 2), new b2Vec2(-4, 3)];
            shape.Set(vertices, 4);
            this.m_ground.CreateFixture(shape, 0.0);
        }

        {
            const shape = new b2PolygonShape();
            const vertices = [new b2Vec2(2, -0.1), new b2Vec2(4, -0.1), new b2Vec2(4, 3), new b2Vec2(2, 2)];
            shape.Set(vertices, 4);
            this.m_ground.CreateFixture(shape, 0.0);
        }

        this.m_particleSystem.SetRadius(0.035 * 2); // HACK: increase particle radius
        {
            const shape = new b2PolygonShape();
            shape.SetAsBox(2, 1, new b2Vec2(0, 1), 0);
            const pd = new b2ParticleGroupDef();
            pd.shape = shape;
            pd.flags = Test.GetParticleParameterValue();
            const group = this.m_particleSystem.CreateParticleGroup(pd);
            if (pd.flags & b2ParticleFlag.b2_colorMixingParticle) {
                this.ColorParticleGroup(group, 0);
            }
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2CircleShape();
            shape.m_p.Set(0, 0.5);
            shape.m_radius = 0.1;
            body.CreateFixture(shape, 0.1);
            this.m_particleSystem.DestroyParticlesInShape(shape, body.GetTransform());
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.1, 0.1, new b2Vec2(-1, 0.5), 0);
            body.CreateFixture(shape, 0.1);
            this.m_particleSystem.DestroyParticlesInShape(shape, body.GetTransform());
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.1, 0.1, new b2Vec2(1, 0.5), 0.5);
            body.CreateFixture(shape, 0.1);
            this.m_particleSystem.DestroyParticlesInShape(shape, body.GetTransform());
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(0, 2), new b2Vec2(0.1, 2.1));
            body.CreateFixture(shape, 1);
            ///  b2MassData massData = {0.1f, 0.5f * (shape.m_vertex1 + shape.m_vertex2), 0.0f};
            const massData = new b2MassData();
            massData.mass = 0.1;
            massData.center.x = 0.5 * shape.m_vertex1.x + shape.m_vertex2.x;
            massData.center.y = 0.5 * shape.m_vertex1.y + shape.m_vertex2.y;
            massData.I = 0.0;
            body.SetMassData(massData);
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(0.3, 2.0), new b2Vec2(0.4, 2.1));
            body.CreateFixture(shape, 1);
            ///  b2MassData massData = {0.1f, 0.5f * (shape.m_vertex1 + shape.m_vertex2), 0.0f};
            const massData = new b2MassData();
            massData.mass = 0.1;
            massData.center.x = 0.5 * shape.m_vertex1.x + shape.m_vertex2.x;
            massData.center.y = 0.5 * shape.m_vertex1.y + shape.m_vertex2.y;
            massData.I = 0.0;
            body.SetMassData(massData);
        }

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
            });
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-0.3, 2.1), new b2Vec2(-0.2, 2.0));
            body.CreateFixture(shape, 1);
            ///  b2MassData massData = {0.1f, 0.5f * (shape.m_vertex1 + shape.m_vertex2), 0.0f};
            const massData = new b2MassData();
            massData.mass = 0.1;
            massData.center.x = 0.5 * shape.m_vertex1.x + shape.m_vertex2.x;
            massData.center.y = 0.5 * shape.m_vertex1.y + shape.m_vertex2.y;
            massData.I = 0.0;
            body.SetMassData(massData);
        }
    }

    public GetDefaultViewZoom() {
        return 250;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 1,
        };
    }
}
