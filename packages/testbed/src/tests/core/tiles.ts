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

import { b2Timer, b2Vec2, b2PolygonShape, b2BodyType } from "@box2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";

/**
 * This stress tests the dynamic tree broad-phase. This also
 * shows that tile based collision is _not_ smooth due to Box2D
 * not knowing about adjacency.
 */

export class Tiles extends Test {
    public static readonly e_count = 20;

    public m_fixtureCount = 0;

    public m_createTime = 0.0;

    constructor() {
        super();

        this.m_fixtureCount = 0;
        /* b2Timer */
        const timer = new b2Timer();

        {
            /* float32 */
            const a = 0.5;
            /* b2Body */
            const ground = this.m_world.CreateBody({
                position: { x: 0, y: -a },
            });

            {
                /* int32 */
                const N = 200;
                /* int32 */
                const M = 10;
                /* b2Vec2 */
                const position = new b2Vec2();
                position.y = 0.0;
                for (/* int32 */ let j = 0; j < M; ++j) {
                    position.x = -N * a;
                    for (/* int32 */ let i = 0; i < N; ++i) {
                        /* b2PolygonShape */
                        const shape = new b2PolygonShape();
                        shape.SetAsBox(a, a, position, 0.0);
                        ground.CreateFixture(shape, 0.0);
                        ++this.m_fixtureCount;
                        position.x += 2.0 * a;
                    }
                    position.y -= 2.0 * a;
                }
            }
            //    else
            //    {
            //      /*int32*/ const N = 200;
            //      /*int32*/ const M = 10;
            //      /*b2Vec2*/ const position = new b2Vec2();
            //      position.x = -N * a;
            //      for (/*int32*/ let i = 0; i < N; ++i)
            //      {
            //        position.y = 0.0;
            //        for (/*int32*/ let j = 0; j < M; ++j)
            //        {
            //          /*b2PolygonShape*/ const shape = new b2PolygonShape();
            //          shape.SetAsBox(a, a, position, 0.0);
            //          ground.CreateFixture(shape, 0.0);
            //          position.y -= 2.0 * a;
            //        }
            //        position.x += 2.0 * a;
            //      }
            //    }
        }

        {
            /* float32 */
            const a = 0.5;
            /* b2PolygonShape */
            const shape = new b2PolygonShape();
            shape.SetAsBox(a, a);

            /* b2Vec2 */
            const x = new b2Vec2(-7.0, 0.75);
            /* b2Vec2 */
            const y = new b2Vec2();
            /* b2Vec2 */
            const deltaX = new b2Vec2(0.5625, 1.25);
            /* b2Vec2 */
            const deltaY = new b2Vec2(1.125, 0.0);

            for (/* int32 */ let i = 0; i < Tiles.e_count; ++i) {
                y.Copy(x);

                for (/* int32 */ let j = i; j < Tiles.e_count; ++j) {
                    /* b2Body */
                    const body = this.m_world.CreateBody({
                        type: b2BodyType.b2_dynamicBody,
                        position: y,
                        // allowSleep: i !== 0 || j !== 0,
                    });
                    body.CreateFixture(shape, 5.0);
                    ++this.m_fixtureCount;
                    y.Add(deltaY);
                }

                x.Add(deltaX);
            }
        }

        this.m_createTime = timer.GetMilliseconds();
    }

    public Step(settings: Settings, timeStep: number): void {
        /* const b2ContactManager */
        const cm = this.m_world.GetContactManager();
        /* int32 */
        const height = cm.m_broadPhase.GetTreeHeight();
        /* int32 */
        const leafCount = cm.m_broadPhase.GetProxyCount();
        /* int32 */
        const minimumNodeCount = 2 * leafCount - 1;
        /* float32 */
        const minimumHeight = Math.ceil(Math.log(minimumNodeCount) / Math.log(2.0));
        this.addDebug("Dynamic Tree Height", height);
        this.addDebug("Min Height", minimumHeight);

        super.Step(settings, timeStep);

        this.addDebug("Create Time", `${this.m_createTime.toFixed(2)} ms`);
        this.addDebug("Fixture Count", this.m_fixtureCount);

        // b2DynamicTree* tree = this.m_world.this.m_contactManager.m_broadPhase.m_tree;

        // if (this.m_stepCount === 400)
        // {
        //  tree.RebuildBottomUp();
        // }
    }
}
