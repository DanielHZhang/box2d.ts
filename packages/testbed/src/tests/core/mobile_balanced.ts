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

import { b2Vec2, b2RevoluteJointDef, b2Body, b2BodyType, b2PolygonShape, XY } from "@box2d/core";

import { Test } from "../../test";

export class MobileBalanced extends Test {
    public static readonly e_depth = 4;

    constructor() {
        super();

        // Create ground body.
        const ground = this.m_world.CreateBody({
            position: { x: 0, y: 20 },
        });

        const /* float32 */ a = 0.5;
        const /* b2Vec2 */ h = new b2Vec2(0.0, a);

        const /* b2Body */ root = this.AddNode(ground, b2Vec2.ZERO, 0, 3.0, a);

        const /* b2RevoluteJointDef */ jointDef = new b2RevoluteJointDef();
        jointDef.bodyA = ground;
        jointDef.bodyB = root;
        jointDef.localAnchorA.SetZero();
        jointDef.localAnchorB.Copy(h);
        this.m_world.CreateJoint(jointDef);
    }

    public GetDefaultViewZoom() {
        return 60;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 15,
        };
    }

    public AddNode(parent: b2Body, localAnchor: b2Vec2, depth: number, offset: number, a: number): b2Body {
        const /* float32 */ density = 20.0;
        const /* b2Vec2 */ h = new b2Vec2(0.0, a);

        //  b2Vec2 p = parent->GetPosition() + localAnchor - h;
        const /* b2Vec2 */ p = parent.GetPosition().Clone().Add(localAnchor).Subtract(h);

        const /* b2Body */ body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: p,
            });

        const /* b2PolygonShape */ shape = new b2PolygonShape();
        shape.SetAsBox(0.25 * a, a);
        body.CreateFixture(shape, density);

        if (depth === MobileBalanced.e_depth) {
            return body;
        }

        shape.SetAsBox(offset, 0.25 * a, new b2Vec2(0, -a), 0.0);
        body.CreateFixture(shape, density);

        const /* b2Vec2 */ a1 = new b2Vec2(offset, -a);
        const /* b2Vec2 */ a2 = new b2Vec2(-offset, -a);
        const /* b2Body */ body1 = this.AddNode(body, a1, depth + 1, 0.5 * offset, a);
        const /* b2Body */ body2 = this.AddNode(body, a2, depth + 1, 0.5 * offset, a);

        const /* b2RevoluteJointDef */ jointDef = new b2RevoluteJointDef();
        jointDef.bodyA = body;
        jointDef.localAnchorB.Copy(h);

        jointDef.localAnchorA.Copy(a1);
        jointDef.bodyB = body1;
        this.m_world.CreateJoint(jointDef);

        jointDef.localAnchorA.Copy(a2);
        jointDef.bodyB = body2;
        this.m_world.CreateJoint(jointDef);

        return body;
    }
}
