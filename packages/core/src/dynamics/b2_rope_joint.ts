/*
 * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
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

import { b2_linearSlop, b2_maxLinearCorrection } from "../common/b2_common";
import { b2Clamp, b2Vec2, b2Rot, XY } from "../common/b2_math";
import { b2Joint, b2JointDef, b2JointType, b2IJointDef } from "./b2_joint";
import { b2SolverData } from "./b2_time_step";

export interface b2IRopeJointDef extends b2IJointDef {
    localAnchorA?: XY;

    localAnchorB?: XY;

    maxLength?: number;
}

/// Rope joint definition. This requires two body anchor points and
/// a maximum lengths.
/// Note: by default the connected objects will not collide.
/// see collideConnected in b2JointDef.
export class b2RopeJointDef extends b2JointDef implements b2IRopeJointDef {
    public readonly localAnchorA: b2Vec2 = new b2Vec2(-1, 0);

    public readonly localAnchorB: b2Vec2 = new b2Vec2(1, 0);

    public maxLength = 0;

    constructor() {
        super(b2JointType.e_ropeJoint);
    }
}

const defaultLocalAnchorA = new b2Vec2(-1, 0);
const defaultLocalAnchorB = b2Vec2.UNITX;

export class b2RopeJoint extends b2Joint {
    // Solver shared
    public readonly m_localAnchorA: b2Vec2 = new b2Vec2();

    public readonly m_localAnchorB: b2Vec2 = new b2Vec2();

    public m_maxLength = 0;

    public m_length = 0;

    public m_impulse = 0;

    // Solver temp
    public m_indexA = 0;

    public m_indexB = 0;

    public readonly m_u: b2Vec2 = new b2Vec2();

    public readonly m_rA: b2Vec2 = new b2Vec2();

    public readonly m_rB: b2Vec2 = new b2Vec2();

    public readonly m_localCenterA: b2Vec2 = new b2Vec2();

    public readonly m_localCenterB: b2Vec2 = new b2Vec2();

    public m_invMassA = 0;

    public m_invMassB = 0;

    public m_invIA = 0;

    public m_invIB = 0;

    public m_mass = 0;

    public readonly m_qA: b2Rot = new b2Rot();

    public readonly m_qB: b2Rot = new b2Rot();

    public readonly m_lalcA: b2Vec2 = new b2Vec2();

    public readonly m_lalcB: b2Vec2 = new b2Vec2();

    constructor(def: b2IRopeJointDef) {
        super(def);

        this.m_localAnchorA.Copy(def.localAnchorA ?? defaultLocalAnchorA);
        this.m_localAnchorB.Copy(def.localAnchorB ?? defaultLocalAnchorB);
        this.m_maxLength = def.maxLength ?? 0;
    }

    private static InitVelocityConstraints_s_P = new b2Vec2();

    public InitVelocityConstraints(data: b2SolverData): void {
        this.m_indexA = this.m_bodyA.m_islandIndex;
        this.m_indexB = this.m_bodyB.m_islandIndex;
        this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);
        this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;

        const cA: b2Vec2 = data.positions[this.m_indexA].c;
        const aA: number = data.positions[this.m_indexA].a;
        const vA: b2Vec2 = data.velocities[this.m_indexA].v;
        let wA: number = data.velocities[this.m_indexA].w;

        const cB: b2Vec2 = data.positions[this.m_indexB].c;
        const aB: number = data.positions[this.m_indexB].a;
        const vB: b2Vec2 = data.velocities[this.m_indexB].v;
        let wB: number = data.velocities[this.m_indexB].w;

        const qA: b2Rot = this.m_qA.Set(aA);
        const qB: b2Rot = this.m_qB.Set(aB);

        // this.m_rA = b2Mul(qA, this.m_localAnchorA - this.m_localCenterA);
        b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // this.m_rB = b2Mul(qB, this.m_localAnchorB - this.m_localCenterB);
        b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
        // this.m_u = cB + this.m_rB - cA - this.m_rA;
        this.m_u.Copy(cB).Add(this.m_rB).Subtract(cA).Subtract(this.m_rA);

        this.m_length = this.m_u.Length();

        if (this.m_length > b2_linearSlop) {
            this.m_u.Scale(1 / this.m_length);
        } else {
            this.m_u.SetZero();
            this.m_mass = 0;
            this.m_impulse = 0;
            return;
        }

        // Compute effective mass.
        const crA: number = b2Vec2.Cross(this.m_rA, this.m_u);
        const crB: number = b2Vec2.Cross(this.m_rB, this.m_u);
        const invMass: number = this.m_invMassA + this.m_invIA * crA * crA + this.m_invMassB + this.m_invIB * crB * crB;

        this.m_mass = invMass !== 0 ? 1 / invMass : 0;

        if (data.step.warmStarting) {
            // Scale the impulse to support a variable time step.
            this.m_impulse *= data.step.dtRatio;

            // b2Vec2 P = m_impulse * m_u;
            const P: b2Vec2 = b2Vec2.Scale(this.m_impulse, this.m_u, b2RopeJoint.InitVelocityConstraints_s_P);
            // vA -= m_invMassA * P;
            vA.SubtractScaled(this.m_invMassA, P);
            wA -= this.m_invIA * b2Vec2.Cross(this.m_rA, P);
            // vB += m_invMassB * P;
            vB.AddScaled(this.m_invMassB, P);
            wB += this.m_invIB * b2Vec2.Cross(this.m_rB, P);
        } else {
            this.m_impulse = 0;
        }

        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }

    private static SolveVelocityConstraints_s_vpA = new b2Vec2();

    private static SolveVelocityConstraints_s_vpB = new b2Vec2();

    private static SolveVelocityConstraints_s_P = new b2Vec2();

    public SolveVelocityConstraints(data: b2SolverData): void {
        const vA: b2Vec2 = data.velocities[this.m_indexA].v;
        let wA: number = data.velocities[this.m_indexA].w;
        const vB: b2Vec2 = data.velocities[this.m_indexB].v;
        let wB: number = data.velocities[this.m_indexB].w;

        // Cdot = dot(u, v + cross(w, r))
        // b2Vec2 vpA = vA + b2Cross(wA, m_rA);
        const vpA: b2Vec2 = b2Vec2.AddCrossScalarVec2(vA, wA, this.m_rA, b2RopeJoint.SolveVelocityConstraints_s_vpA);
        // b2Vec2 vpB = vB + b2Cross(wB, m_rB);
        const vpB: b2Vec2 = b2Vec2.AddCrossScalarVec2(vB, wB, this.m_rB, b2RopeJoint.SolveVelocityConstraints_s_vpB);
        // float32 C = m_length - m_maxLength;
        const C: number = this.m_length - this.m_maxLength;
        // float32 Cdot = b2Dot(m_u, vpB - vpA);
        let Cdot: number = b2Vec2.Dot(this.m_u, b2Vec2.Subtract(vpB, vpA, b2Vec2.s_t0));

        // Predictive constraint.
        if (C < 0) {
            Cdot += data.step.inv_dt * C;
        }

        let impulse: number = -this.m_mass * Cdot;
        const oldImpulse: number = this.m_impulse;
        this.m_impulse = Math.min(0, this.m_impulse + impulse);
        impulse = this.m_impulse - oldImpulse;

        // b2Vec2 P = impulse * m_u;
        const P: b2Vec2 = b2Vec2.Scale(impulse, this.m_u, b2RopeJoint.SolveVelocityConstraints_s_P);
        // vA -= m_invMassA * P;
        vA.SubtractScaled(this.m_invMassA, P);
        wA -= this.m_invIA * b2Vec2.Cross(this.m_rA, P);
        // vB += m_invMassB * P;
        vB.AddScaled(this.m_invMassB, P);
        wB += this.m_invIB * b2Vec2.Cross(this.m_rB, P);

        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }

    private static SolvePositionConstraints_s_P = new b2Vec2();

    public SolvePositionConstraints(data: b2SolverData): boolean {
        const cA: b2Vec2 = data.positions[this.m_indexA].c;
        let aA: number = data.positions[this.m_indexA].a;
        const cB: b2Vec2 = data.positions[this.m_indexB].c;
        let aB: number = data.positions[this.m_indexB].a;

        const qA: b2Rot = this.m_qA.Set(aA);
        const qB: b2Rot = this.m_qB.Set(aB);

        // b2Vec2 rA = b2Mul(qA, this.m_localAnchorA - this.m_localCenterA);
        b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, this.m_localAnchorB - this.m_localCenterB);
        b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
        // b2Vec2 u = cB + rB - cA - rA;
        const u: b2Vec2 = this.m_u.Copy(cB).Add(rB).Subtract(cA).Subtract(rA);

        this.m_length = u.Normalize();
        let C: number = this.m_length - this.m_maxLength;

        C = b2Clamp(C, 0, b2_maxLinearCorrection);

        const impulse: number = -this.m_mass * C;
        // b2Vec2 P = impulse * u;
        const P: b2Vec2 = b2Vec2.Scale(impulse, u, b2RopeJoint.SolvePositionConstraints_s_P);

        // cA -= m_invMassA * P;
        cA.SubtractScaled(this.m_invMassA, P);
        aA -= this.m_invIA * b2Vec2.Cross(rA, P);
        // cB += m_invMassB * P;
        cB.AddScaled(this.m_invMassB, P);
        aB += this.m_invIB * b2Vec2.Cross(rB, P);

        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;

        return this.m_length - this.m_maxLength < b2_linearSlop;
    }

    public GetAnchorA<T extends XY>(out: T): T {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }

    public GetAnchorB<T extends XY>(out: T): T {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }

    public GetReactionForce<T extends XY>(inv_dt: number, out: T): T {
        // return out.Set(inv_dt * this.m_linearImpulse.x, inv_dt * this.m_linearImpulse.y);
        return b2Vec2.Scale(inv_dt * this.m_impulse, this.m_u, out);
    }

    public GetReactionTorque(_inv_dt: number): number {
        return 0;
    }

    public GetLocalAnchorA(): Readonly<b2Vec2> {
        return this.m_localAnchorA;
    }

    public GetLocalAnchorB(): Readonly<b2Vec2> {
        return this.m_localAnchorB;
    }

    public SetMaxLength(length: number): void {
        this.m_maxLength = length;
    }

    public GetMaxLength(): number {
        return this.m_maxLength;
    }

    public GetLength(): number {
        return this.m_length;
    }
}
