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

import { b2Body, b2EdgeShape, b2Vec2, b2PolygonShape, b2BodyType, b2RandomRange, b2Gjk, b2Toi } from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";

export class ContinuousTest extends Test {
    public m_body: b2Body;

    public m_angularVelocity = 0.0;

    constructor() {
        super();

        {
            const body = this.m_world.CreateBody();

            const edge = new b2EdgeShape();

            edge.SetTwoSided(new b2Vec2(-10.0, 0.0), new b2Vec2(10.0, 0.0));
            body.CreateFixture(edge, 0.0);

            const shape = new b2PolygonShape();
            shape.SetAsBox(0.2, 1.0, new b2Vec2(0.5, 1.0), 0.0);
            body.CreateFixture(shape, 0.0);
        }

        {
            const shape = new b2PolygonShape();
            shape.SetAsBox(2.0, 0.1);

            this.m_body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: { x: 0.0, y: 20.0 },
                // angle: 0.1,
            });
            this.m_body.CreateFixture(shape, 1.0);

            this.m_angularVelocity = b2RandomRange(-50.0, 50.0);
            // this.m_angularVelocity = 46.661274;
            this.m_body.SetLinearVelocity(new b2Vec2(0.0, -100.0));
            this.m_body.SetAngularVelocity(this.m_angularVelocity);
        }
        /*
    else
    {
      const body = this.m_world.CreateBody({
        type: b2BodyType.b2_dynamicBody,
        position: { y: 0.0, y:2.0}
      });
      const shape = new b2CircleShape();
      shape.m_p.SetZero();
      shape.m_radius = 0.5;
      body.CreateFixture(shape, 1.0);
      body = this.m_world.CreateBody({
        type: b2BodyType.b2_dynamicBody,
        bullet: true,
        position: { y: 0.0, y:10.0}
      });
      body.CreateFixture(shape, 1.0);
      body.SetLinearVelocity(new b2Vec2(0.0, -100.0));
    }
    */

        // b2Gjk.calls = 0;
        // b2Gjk.iters = 0;
        // b2Gjk.maxIters = 0;
        b2Gjk.reset();
        // b2Toi.calls = 0;
        // b2Toi.iters = 0;
        // b2Toi.rootIters = 0;
        // b2Toi.maxRootIters = 0;
        // b2Toi.time = 0.0;
        // b2Toi.maxTime = 0.0;
        b2Toi.reset();
    }

    public Launch() {
        // b2Gjk.calls = 0;
        // b2Gjk.iters = 0;
        // b2Gjk.maxIters = 0;
        b2Gjk.reset();
        // b2Toi.calls = 0;
        // b2Toi.iters = 0;
        // b2Toi.rootIters = 0;
        // b2Toi.maxRootIters = 0;
        // b2Toi.time = 0.0;
        // b2Toi.maxTime = 0.0;
        b2Toi.reset();

        this.m_body.SetTransformVec(new b2Vec2(0.0, 20.0), 0.0);
        this.m_angularVelocity = b2RandomRange(-50.0, 50.0);
        this.m_body.SetLinearVelocity(new b2Vec2(0.0, -100.0));
        this.m_body.SetAngularVelocity(this.m_angularVelocity);
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);

        if (b2Gjk.calls > 0) {
            this.addDebug(
                "GJK Calls [ave Iters] (max Iters)",
                `${b2Gjk.calls.toFixed(0)} [${(b2Gjk.iters / b2Gjk.calls).toFixed(1)}] (${b2Gjk.maxIters.toFixed(0)})`,
            );
        }

        if (b2Toi.calls > 0) {
            this.addDebug(
                "Toi Calls [ave Iters] (max Iters)",
                `${b2Toi.calls} [${(b2Toi.iters / b2Toi.calls).toFixed(1)}] (${b2Toi.maxIters})`,
            );

            this.addDebug(
                "Toi Root [ave Iters] (max Iters)",
                `${b2Toi.calls} [${(b2Toi.rootIters / b2Toi.calls).toFixed(1)}] (${b2Toi.maxRootIters})`,
            );

            this.addDebug(
                "Toi Time in ms [ave] (max)",
                `[${((1000.0 * b2Toi.time) / b2Toi.calls).toFixed(1)}] (${(1000.0 * b2Toi.maxTime).toFixed(1)})`,
            );
        }

        if (this.m_stepCount % 60 === 0) {
            this.Launch();
        }
    }

    public GetDefaultViewZoom() {
        return 50;
    }
}
