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

// DEBUG: import { b2Assert, b2_epsilon } from "../common/b2_common";
import { b2_linearSlop } from "../common/b2_common";
import { b2Vec2, b2Rot, XY } from "../common/b2_math";
import { b2Body } from "./b2_body";
import { b2Joint, b2JointDef, b2JointType, b2IJointDef } from "./b2_joint";
import { b2SolverData } from "./b2_time_step";

export const b2_minPulleyLength = 2;

export interface b2IPulleyJointDef extends b2IJointDef {
    groundAnchorA?: XY;

    groundAnchorB?: XY;

    localAnchorA?: XY;

    localAnchorB?: XY;

    lengthA?: number;

    lengthB?: number;

    ratio?: number;
}

/// Pulley joint definition. This requires two ground anchors,
/// two dynamic body anchor points, and a pulley ratio.
export class b2PulleyJointDef extends b2JointDef implements b2IPulleyJointDef {
    public readonly groundAnchorA: b2Vec2 = new b2Vec2(-1, 1);

    public readonly groundAnchorB: b2Vec2 = new b2Vec2(1, 1);

    public readonly localAnchorA: b2Vec2 = new b2Vec2(-1, 0);

    public readonly localAnchorB: b2Vec2 = new b2Vec2(1, 0);

    public lengthA = 0;

    public lengthB = 0;

    public ratio = 1;

    constructor() {
        super(b2JointType.e_pulleyJoint);
        this.collideConnected = true;
    }

    public Initialize(
        bA: b2Body,
        bB: b2Body,
        groundA: b2Vec2,
        groundB: b2Vec2,
        anchorA: b2Vec2,
        anchorB: b2Vec2,
        r: number,
    ): void {
        this.bodyA = bA;
        this.bodyB = bB;
        this.groundAnchorA.Copy(groundA);
        this.groundAnchorB.Copy(groundB);
        this.bodyA.GetLocalPoint(anchorA, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchorB, this.localAnchorB);
        this.lengthA = b2Vec2.Distance(anchorA, groundA);
        this.lengthB = b2Vec2.Distance(anchorB, groundB);
        this.ratio = r;
        // DEBUG: b2Assert(this.ratio > b2_epsilon);
    }
}

const defaultGroundAnchorA = new b2Vec2(-1, 1);
const defaultGroundAnchorB = b2Vec2.UNITX;
const defaultLocalAnchorA = new b2Vec2(-1, 0);
const defaultLocalAnchorB = b2Vec2.UNITX;

export class b2PulleyJoint extends b2Joint {
    public readonly m_groundAnchorA: b2Vec2 = new b2Vec2();

    public readonly m_groundAnchorB: b2Vec2 = new b2Vec2();

    public m_lengthA = 0;

    public m_lengthB = 0;

    // Solver shared
    public readonly m_localAnchorA: b2Vec2 = new b2Vec2();

    public readonly m_localAnchorB: b2Vec2 = new b2Vec2();

    public m_constant = 0;

    public m_ratio = 0;

    public m_impulse = 0;

    // Solver temp
    public m_indexA = 0;

    public m_indexB = 0;

    public readonly m_uA: b2Vec2 = new b2Vec2();

    public readonly m_uB: b2Vec2 = new b2Vec2();

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

    constructor(def: b2IPulleyJointDef) {
        super(def);

        this.m_groundAnchorA.Copy(def.groundAnchorA ?? defaultGroundAnchorA);
        this.m_groundAnchorB.Copy(def.groundAnchorB ?? defaultGroundAnchorB);
        this.m_localAnchorA.Copy(def.localAnchorA ?? defaultLocalAnchorA);
        this.m_localAnchorB.Copy(def.localAnchorB ?? defaultLocalAnchorB);

        this.m_lengthA = def.lengthA ?? 0;
        this.m_lengthB = def.lengthB ?? 0;

        // DEBUG: b2Assert((def.ratio ?? 1) !== 0);
        this.m_ratio = def.ratio ?? 1;

        this.m_constant = (def.lengthA ?? 0) + this.m_ratio * (def.lengthB ?? 0);

        this.m_impulse = 0;
    }

    private static InitVelocityConstraints_s_PA = new b2Vec2();

    private static InitVelocityConstraints_s_PB = new b2Vec2();

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

        // b2Rot qA(aA), qB(aB);
        const qA: b2Rot = this.m_qA.Set(aA);
        const qB: b2Rot = this.m_qB.Set(aB);

        // m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);

        // Get the pulley axes.
        // m_uA = cA + m_rA - m_groundAnchorA;
        this.m_uA.Copy(cA).Add(this.m_rA).Subtract(this.m_groundAnchorA);
        // m_uB = cB + m_rB - m_groundAnchorB;
        this.m_uB.Copy(cB).Add(this.m_rB).Subtract(this.m_groundAnchorB);

        const lengthA: number = this.m_uA.Length();
        const lengthB: number = this.m_uB.Length();

        if (lengthA > 10 * b2_linearSlop) {
            this.m_uA.Scale(1 / lengthA);
        } else {
            this.m_uA.SetZero();
        }

        if (lengthB > 10 * b2_linearSlop) {
            this.m_uB.Scale(1 / lengthB);
        } else {
            this.m_uB.SetZero();
        }

        // Compute effective mass.
        const ruA: number = b2Vec2.Cross(this.m_rA, this.m_uA);
        const ruB: number = b2Vec2.Cross(this.m_rB, this.m_uB);

        const mA: number = this.m_invMassA + this.m_invIA * ruA * ruA;
        const mB: number = this.m_invMassB + this.m_invIB * ruB * ruB;

        this.m_mass = mA + this.m_ratio * this.m_ratio * mB;

        if (this.m_mass > 0) {
            this.m_mass = 1 / this.m_mass;
        }

        if (data.step.warmStarting) {
            // Scale impulses to support variable time steps.
            this.m_impulse *= data.step.dtRatio;

            // Warm starting.
            // b2Vec2 PA = -(m_impulse) * m_uA;
            const PA: b2Vec2 = b2Vec2.Scale(-this.m_impulse, this.m_uA, b2PulleyJoint.InitVelocityConstraints_s_PA);
            // b2Vec2 PB = (-m_ratio * m_impulse) * m_uB;
            const PB: b2Vec2 = b2Vec2.Scale(
                -this.m_ratio * this.m_impulse,
                this.m_uB,
                b2PulleyJoint.InitVelocityConstraints_s_PB,
            );

            // vA += m_invMassA * PA;
            vA.AddScaled(this.m_invMassA, PA);
            wA += this.m_invIA * b2Vec2.Cross(this.m_rA, PA);
            // vB += m_invMassB * PB;
            vB.AddScaled(this.m_invMassB, PB);
            wB += this.m_invIB * b2Vec2.Cross(this.m_rB, PB);
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

    private static SolveVelocityConstraints_s_PA = new b2Vec2();

    private static SolveVelocityConstraints_s_PB = new b2Vec2();

    public SolveVelocityConstraints(data: b2SolverData): void {
        const vA: b2Vec2 = data.velocities[this.m_indexA].v;
        let wA: number = data.velocities[this.m_indexA].w;
        const vB: b2Vec2 = data.velocities[this.m_indexB].v;
        let wB: number = data.velocities[this.m_indexB].w;

        // b2Vec2 vpA = vA + b2Cross(wA, m_rA);
        const vpA: b2Vec2 = b2Vec2.AddCrossScalarVec2(vA, wA, this.m_rA, b2PulleyJoint.SolveVelocityConstraints_s_vpA);
        // b2Vec2 vpB = vB + b2Cross(wB, m_rB);
        const vpB: b2Vec2 = b2Vec2.AddCrossScalarVec2(vB, wB, this.m_rB, b2PulleyJoint.SolveVelocityConstraints_s_vpB);

        const Cdot: number = -b2Vec2.Dot(this.m_uA, vpA) - this.m_ratio * b2Vec2.Dot(this.m_uB, vpB);
        const impulse: number = -this.m_mass * Cdot;
        this.m_impulse += impulse;

        // b2Vec2 PA = -impulse * m_uA;
        const PA: b2Vec2 = b2Vec2.Scale(-impulse, this.m_uA, b2PulleyJoint.SolveVelocityConstraints_s_PA);
        // b2Vec2 PB = -m_ratio * impulse * m_uB;
        const PB: b2Vec2 = b2Vec2.Scale(
            -this.m_ratio * impulse,
            this.m_uB,
            b2PulleyJoint.SolveVelocityConstraints_s_PB,
        );
        // vA += m_invMassA * PA;
        vA.AddScaled(this.m_invMassA, PA);
        wA += this.m_invIA * b2Vec2.Cross(this.m_rA, PA);
        // vB += m_invMassB * PB;
        vB.AddScaled(this.m_invMassB, PB);
        wB += this.m_invIB * b2Vec2.Cross(this.m_rB, PB);

        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }

    private static SolvePositionConstraints_s_PA = new b2Vec2();

    private static SolvePositionConstraints_s_PB = new b2Vec2();

    public SolvePositionConstraints(data: b2SolverData): boolean {
        const cA: b2Vec2 = data.positions[this.m_indexA].c;
        let aA: number = data.positions[this.m_indexA].a;
        const cB: b2Vec2 = data.positions[this.m_indexB].c;
        let aB: number = data.positions[this.m_indexB].a;

        // b2Rot qA(aA), qB(aB);
        const qA: b2Rot = this.m_qA.Set(aA);
        const qB: b2Rot = this.m_qB.Set(aB);

        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);

        // Get the pulley axes.
        // b2Vec2 uA = cA + rA - m_groundAnchorA;
        const uA = this.m_uA.Copy(cA).Add(rA).Subtract(this.m_groundAnchorA);
        // b2Vec2 uB = cB + rB - m_groundAnchorB;
        const uB = this.m_uB.Copy(cB).Add(rB).Subtract(this.m_groundAnchorB);

        const lengthA: number = uA.Length();
        const lengthB: number = uB.Length();

        if (lengthA > 10 * b2_linearSlop) {
            uA.Scale(1 / lengthA);
        } else {
            uA.SetZero();
        }

        if (lengthB > 10 * b2_linearSlop) {
            uB.Scale(1 / lengthB);
        } else {
            uB.SetZero();
        }

        // Compute effective mass.
        const ruA: number = b2Vec2.Cross(rA, uA);
        const ruB: number = b2Vec2.Cross(rB, uB);

        const mA: number = this.m_invMassA + this.m_invIA * ruA * ruA;
        const mB: number = this.m_invMassB + this.m_invIB * ruB * ruB;

        let mass: number = mA + this.m_ratio * this.m_ratio * mB;

        if (mass > 0) {
            mass = 1 / mass;
        }

        const C: number = this.m_constant - lengthA - this.m_ratio * lengthB;
        const linearError: number = Math.abs(C);

        const impulse: number = -mass * C;

        // b2Vec2 PA = -impulse * uA;
        const PA: b2Vec2 = b2Vec2.Scale(-impulse, uA, b2PulleyJoint.SolvePositionConstraints_s_PA);
        // b2Vec2 PB = -m_ratio * impulse * uB;
        const PB: b2Vec2 = b2Vec2.Scale(-this.m_ratio * impulse, uB, b2PulleyJoint.SolvePositionConstraints_s_PB);

        // cA += m_invMassA * PA;
        cA.AddScaled(this.m_invMassA, PA);
        aA += this.m_invIA * b2Vec2.Cross(rA, PA);
        // cB += m_invMassB * PB;
        cB.AddScaled(this.m_invMassB, PB);
        aB += this.m_invIB * b2Vec2.Cross(rB, PB);

        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;

        return linearError < b2_linearSlop;
    }

    public GetAnchorA<T extends XY>(out: T): T {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }

    public GetAnchorB<T extends XY>(out: T): T {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }

    public GetReactionForce<T extends XY>(inv_dt: number, out: T): T {
        // b2Vec2 P = m_impulse * m_uB;
        // return inv_dt * P;
        out.x = inv_dt * this.m_impulse * this.m_uB.x;
        out.y = inv_dt * this.m_impulse * this.m_uB.y;
        return out;
    }

    public GetReactionTorque(_inv_dt: number): number {
        return 0;
    }

    public GetGroundAnchorA() {
        return this.m_groundAnchorA;
    }

    public GetGroundAnchorB() {
        return this.m_groundAnchorB;
    }

    public GetLengthA() {
        return this.m_lengthA;
    }

    public GetLengthB() {
        return this.m_lengthB;
    }

    public GetRatio() {
        return this.m_ratio;
    }

    private static GetCurrentLengthA_s_p = new b2Vec2();

    public GetCurrentLengthA() {
        // b2Vec2 p = m_bodyA->GetWorldPoint(m_localAnchorA);
        // b2Vec2 s = m_groundAnchorA;
        // b2Vec2 d = p - s;
        // return d.Length();
        const p = this.m_bodyA.GetWorldPoint(this.m_localAnchorA, b2PulleyJoint.GetCurrentLengthA_s_p);
        const s = this.m_groundAnchorA;
        return b2Vec2.Distance(p, s);
    }

    private static GetCurrentLengthB_s_p = new b2Vec2();

    public GetCurrentLengthB() {
        // b2Vec2 p = m_bodyB->GetWorldPoint(m_localAnchorB);
        // b2Vec2 s = m_groundAnchorB;
        // b2Vec2 d = p - s;
        // return d.Length();
        const p = this.m_bodyB.GetWorldPoint(this.m_localAnchorB, b2PulleyJoint.GetCurrentLengthB_s_p);
        const s = this.m_groundAnchorB;
        return b2Vec2.Distance(p, s);
    }

    public ShiftOrigin(newOrigin: b2Vec2) {
        this.m_groundAnchorA.Subtract(newOrigin);
        this.m_groundAnchorB.Subtract(newOrigin);
    }
}
