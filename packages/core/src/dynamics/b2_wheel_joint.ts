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

// DEBUG: import { b2Assert } from "../common/b2_common";
import { b2_linearSlop } from "../common/b2_common";
import { b2Clamp, b2Vec2, b2Rot, XY } from "../common/b2_math";
import { b2Joint, b2JointDef, b2JointType, b2IJointDef } from "./b2_joint";
import { b2SolverData } from "./b2_time_step";
import { b2Body } from "./b2_body";

export interface b2IWheelJointDef extends b2IJointDef {
    /// The local anchor point relative to bodyA's origin.
    localAnchorA?: XY;

    /// The local anchor point relative to bodyB's origin.
    localAnchorB?: XY;

    /// The local translation axis in bodyA.
    localAxisA?: XY;

    /// Enable/disable the joint limit.
    enableLimit?: boolean;

    /// The lower translation limit, usually in meters.
    lowerTranslation?: number;

    /// The upper translation limit, usually in meters.
    upperTranslation?: number;

    /// Enable/disable the joint motor.
    enableMotor?: boolean;

    /// The maximum motor torque, usually in N-m.
    maxMotorTorque?: number;

    /// The desired motor speed in radians per second.
    motorSpeed?: number;

    /// Suspension stiffness. Typically in units N/m.
    stiffness?: number;

    /// Suspension damping. Typically in units of N*s/m.
    damping?: number;
}

/// Wheel joint definition. This requires defining a line of
/// motion using an axis and an anchor point. The definition uses local
/// anchor points and a local axis so that the initial configuration
/// can violate the constraint slightly. The joint translation is zero
/// when the local anchor points coincide in world space. Using local
/// anchors and a local axis helps when saving and loading a game.
export class b2WheelJointDef extends b2JointDef implements b2IWheelJointDef {
    public readonly localAnchorA: b2Vec2 = new b2Vec2(0, 0);

    public readonly localAnchorB: b2Vec2 = new b2Vec2(0, 0);

    public readonly localAxisA: b2Vec2 = new b2Vec2(1, 0);

    public enableLimit = false;

    public lowerTranslation = 0;

    public upperTranslation = 0;

    public enableMotor = false;

    public maxMotorTorque = 0;

    public motorSpeed = 0;

    public stiffness = 0;

    public damping = 0;

    constructor() {
        super(b2JointType.e_wheelJoint);
    }

    public Initialize(bA: b2Body, bB: b2Body, anchor: b2Vec2, axis: b2Vec2): void {
        this.bodyA = bA;
        this.bodyB = bB;
        this.bodyA.GetLocalPoint(anchor, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchor, this.localAnchorB);
        this.bodyA.GetLocalVector(axis, this.localAxisA);
    }
}

export class b2WheelJoint extends b2Joint {
    public readonly m_localAnchorA: b2Vec2 = new b2Vec2();

    public readonly m_localAnchorB: b2Vec2 = new b2Vec2();

    public readonly m_localXAxisA: b2Vec2 = new b2Vec2();

    public readonly m_localYAxisA: b2Vec2 = new b2Vec2();

    public m_impulse = 0;

    public m_motorImpulse = 0;

    public m_springImpulse = 0;

    public m_lowerImpulse = 0;

    public m_upperImpulse = 0;

    public m_translation = 0;

    public m_lowerTranslation = 0;

    public m_upperTranslation = 0;

    public m_maxMotorTorque = 0;

    public m_motorSpeed = 0;

    public m_enableLimit = false;

    public m_enableMotor = false;

    public m_stiffness = 0;

    public m_damping = 0;

    // Solver temp
    public m_indexA = 0;

    public m_indexB = 0;

    public readonly m_localCenterA: b2Vec2 = new b2Vec2();

    public readonly m_localCenterB: b2Vec2 = new b2Vec2();

    public m_invMassA = 0;

    public m_invMassB = 0;

    public m_invIA = 0;

    public m_invIB = 0;

    public readonly m_ax: b2Vec2 = new b2Vec2();

    public readonly m_ay: b2Vec2 = new b2Vec2();

    public m_sAx = 0;

    public m_sBx = 0;

    public m_sAy = 0;

    public m_sBy = 0;

    public m_mass = 0;

    public m_motorMass = 0;

    public m_axialMass = 0;

    public m_springMass = 0;

    public m_bias = 0;

    public m_gamma = 0;

    public readonly m_qA: b2Rot = new b2Rot();

    public readonly m_qB: b2Rot = new b2Rot();

    public readonly m_lalcA: b2Vec2 = new b2Vec2();

    public readonly m_lalcB: b2Vec2 = new b2Vec2();

    public readonly m_rA: b2Vec2 = new b2Vec2();

    public readonly m_rB: b2Vec2 = new b2Vec2();

    constructor(def: b2IWheelJointDef) {
        super(def);

        this.m_localAnchorA.Copy(def.localAnchorA ?? b2Vec2.ZERO);
        this.m_localAnchorB.Copy(def.localAnchorB ?? b2Vec2.ZERO);
        this.m_localXAxisA.Copy(def.localAxisA ?? b2Vec2.UNITX);
        b2Vec2.CrossOneVec2(this.m_localXAxisA, this.m_localYAxisA);

        this.m_lowerTranslation = def.lowerTranslation ?? 0;
        this.m_upperTranslation = def.upperTranslation ?? 0;
        this.m_enableLimit = def.enableLimit ?? false;

        this.m_maxMotorTorque = def.maxMotorTorque ?? 0;
        this.m_motorSpeed = def.motorSpeed ?? 0;
        this.m_enableMotor = def.enableMotor ?? false;

        this.m_ax.SetZero();
        this.m_ay.SetZero();

        this.m_stiffness = def.stiffness ?? 0;
        this.m_damping = def.damping ?? 0;
    }

    public GetMotorSpeed(): number {
        return this.m_motorSpeed;
    }

    public GetMaxMotorTorque(): number {
        return this.m_maxMotorTorque;
    }

    public SetSpringFrequencyHz(hz: number): void {
        this.m_stiffness = hz;
    }

    public GetSpringFrequencyHz(): number {
        return this.m_stiffness;
    }

    public SetSpringDampingRatio(ratio: number): void {
        this.m_damping = ratio;
    }

    public GetSpringDampingRatio(): number {
        return this.m_damping;
    }

    private static InitVelocityConstraints_s_d = new b2Vec2();

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

        const mA: number = this.m_invMassA;
        const mB: number = this.m_invMassB;
        const iA: number = this.m_invIA;
        const iB: number = this.m_invIB;

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

        // Compute the effective masses.
        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
        // b2Vec2 d = cB + rB - cA - rA;
        const d: b2Vec2 = b2Vec2.Subtract(
            b2Vec2.Add(cB, rB, b2Vec2.s_t0),
            b2Vec2.Add(cA, rA, b2Vec2.s_t1),
            b2WheelJoint.InitVelocityConstraints_s_d,
        );

        // Point to line constraint
        // m_ay = b2Mul(qA, m_localYAxisA);
        b2Rot.MultiplyVec2(qA, this.m_localYAxisA, this.m_ay);
        // m_sAy = b2Cross(d + rA, m_ay);
        this.m_sAy = b2Vec2.Cross(b2Vec2.Add(d, rA, b2Vec2.s_t0), this.m_ay);
        // m_sBy = b2Cross(rB, m_ay);
        this.m_sBy = b2Vec2.Cross(rB, this.m_ay);

        this.m_mass = mA + mB + iA * this.m_sAy * this.m_sAy + iB * this.m_sBy * this.m_sBy;

        if (this.m_mass > 0) {
            this.m_mass = 1 / this.m_mass;
        }

        // Spring constraint
        b2Rot.MultiplyVec2(qA, this.m_localXAxisA, this.m_ax); // m_ax = b2Mul(qA, m_localXAxisA);
        this.m_sAx = b2Vec2.Cross(b2Vec2.Add(d, rA, b2Vec2.s_t0), this.m_ax);
        this.m_sBx = b2Vec2.Cross(rB, this.m_ax);

        const invMass: number = mA + mB + iA * this.m_sAx * this.m_sAx + iB * this.m_sBx * this.m_sBx;
        if (invMass > 0.0) {
            this.m_axialMass = 1.0 / invMass;
        } else {
            this.m_axialMass = 0.0;
        }

        this.m_springMass = 0;
        this.m_bias = 0;
        this.m_gamma = 0;

        if (this.m_stiffness > 0.0 && invMass > 0.0) {
            this.m_springMass = 1.0 / invMass;

            const C: number = b2Vec2.Dot(d, this.m_ax);

            // magic formulas
            const h: number = data.step.dt;
            this.m_gamma = h * (this.m_damping + h * this.m_stiffness);
            if (this.m_gamma > 0.0) {
                this.m_gamma = 1.0 / this.m_gamma;
            }

            this.m_bias = C * h * this.m_stiffness * this.m_gamma;

            this.m_springMass = invMass + this.m_gamma;
            if (this.m_springMass > 0.0) {
                this.m_springMass = 1.0 / this.m_springMass;
            }
        } else {
            this.m_springImpulse = 0.0;
        }

        if (this.m_enableLimit) {
            this.m_translation = b2Vec2.Dot(this.m_ax, d);
        } else {
            this.m_lowerImpulse = 0.0;
            this.m_upperImpulse = 0.0;
        }

        if (this.m_enableMotor) {
            this.m_motorMass = iA + iB;
            if (this.m_motorMass > 0) {
                this.m_motorMass = 1 / this.m_motorMass;
            }
        } else {
            this.m_motorMass = 0;
            this.m_motorImpulse = 0;
        }

        if (data.step.warmStarting) {
            // Account for variable time step.
            this.m_impulse *= data.step.dtRatio;
            this.m_springImpulse *= data.step.dtRatio;
            this.m_motorImpulse *= data.step.dtRatio;

            const axialImpulse: number = this.m_springImpulse + this.m_lowerImpulse - this.m_upperImpulse;
            // b2Vec2 P = m_impulse * m_ay + m_springImpulse * m_ax;
            const P: b2Vec2 = b2Vec2.Add(
                b2Vec2.Scale(this.m_impulse, this.m_ay, b2Vec2.s_t0),
                b2Vec2.Scale(axialImpulse, this.m_ax, b2Vec2.s_t1),
                b2WheelJoint.InitVelocityConstraints_s_P,
            );
            // float32 LA = m_impulse * m_sAy + m_springImpulse * m_sAx + m_motorImpulse;
            const LA: number = this.m_impulse * this.m_sAy + axialImpulse * this.m_sAx + this.m_motorImpulse;
            // float32 LB = m_impulse * m_sBy + m_springImpulse * m_sBx + m_motorImpulse;
            const LB: number = this.m_impulse * this.m_sBy + axialImpulse * this.m_sBx + this.m_motorImpulse;

            // vA -= m_invMassA * P;
            vA.SubtractScaled(this.m_invMassA, P);
            wA -= this.m_invIA * LA;

            // vB += m_invMassB * P;
            vB.AddScaled(this.m_invMassB, P);
            wB += this.m_invIB * LB;
        } else {
            this.m_impulse = 0;
            this.m_springImpulse = 0;
            this.m_motorImpulse = 0;
            this.m_lowerImpulse = 0;
            this.m_upperImpulse = 0;
        }

        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }

    private static SolveVelocityConstraints_s_P = new b2Vec2();

    public SolveVelocityConstraints(data: b2SolverData): void {
        const mA: number = this.m_invMassA;
        const mB: number = this.m_invMassB;
        const iA: number = this.m_invIA;
        const iB: number = this.m_invIB;

        const vA: b2Vec2 = data.velocities[this.m_indexA].v;
        let wA: number = data.velocities[this.m_indexA].w;
        const vB: b2Vec2 = data.velocities[this.m_indexB].v;
        let wB: number = data.velocities[this.m_indexB].w;

        // Solve spring constraint
        {
            const Cdot: number =
                b2Vec2.Dot(this.m_ax, b2Vec2.Subtract(vB, vA, b2Vec2.s_t0)) + this.m_sBx * wB - this.m_sAx * wA;
            const impulse: number = -this.m_springMass * (Cdot + this.m_bias + this.m_gamma * this.m_springImpulse);
            this.m_springImpulse += impulse;

            // b2Vec2 P = impulse * m_ax;
            const P: b2Vec2 = b2Vec2.Scale(impulse, this.m_ax, b2WheelJoint.SolveVelocityConstraints_s_P);
            const LA: number = impulse * this.m_sAx;
            const LB: number = impulse * this.m_sBx;

            // vA -= mA * P;
            vA.SubtractScaled(mA, P);
            wA -= iA * LA;

            // vB += mB * P;
            vB.AddScaled(mB, P);
            wB += iB * LB;
        }

        // Solve rotational motor constraint
        {
            const Cdot: number = wB - wA - this.m_motorSpeed;
            let impulse: number = -this.m_motorMass * Cdot;

            const oldImpulse: number = this.m_motorImpulse;
            const maxImpulse: number = data.step.dt * this.m_maxMotorTorque;
            this.m_motorImpulse = b2Clamp(this.m_motorImpulse + impulse, -maxImpulse, maxImpulse);
            impulse = this.m_motorImpulse - oldImpulse;

            wA -= iA * impulse;
            wB += iB * impulse;
        }

        if (this.m_enableLimit) {
            // Lower limit
            {
                const C: number = this.m_translation - this.m_lowerTranslation;
                const Cdot: number =
                    b2Vec2.Dot(this.m_ax, b2Vec2.Subtract(vB, vA, b2Vec2.s_t0)) + this.m_sBx * wB - this.m_sAx * wA;
                let impulse: number = -this.m_axialMass * (Cdot + Math.max(C, 0.0) * data.step.inv_dt);
                const oldImpulse: number = this.m_lowerImpulse;
                this.m_lowerImpulse = Math.max(this.m_lowerImpulse + impulse, 0.0);
                impulse = this.m_lowerImpulse - oldImpulse;

                // b2Vec2 P = impulse * this.m_ax;
                const P: b2Vec2 = b2Vec2.Scale(impulse, this.m_ax, b2WheelJoint.SolveVelocityConstraints_s_P);
                const LA: number = impulse * this.m_sAx;
                const LB: number = impulse * this.m_sBx;

                // vA -= mA * P;
                vA.SubtractScaled(mA, P);
                wA -= iA * LA;
                // vB += mB * P;
                vB.AddScaled(mB, P);
                wB += iB * LB;
            }

            // Upper limit
            // Note: signs are flipped to keep C positive when the constraint is satisfied.
            // This also keeps the impulse positive when the limit is active.
            {
                const C: number = this.m_upperTranslation - this.m_translation;
                const Cdot: number =
                    b2Vec2.Dot(this.m_ax, b2Vec2.Subtract(vA, vB, b2Vec2.s_t0)) + this.m_sAx * wA - this.m_sBx * wB;
                let impulse: number = -this.m_axialMass * (Cdot + Math.max(C, 0.0) * data.step.inv_dt);
                const oldImpulse: number = this.m_upperImpulse;
                this.m_upperImpulse = Math.max(this.m_upperImpulse + impulse, 0.0);
                impulse = this.m_upperImpulse - oldImpulse;

                // b2Vec2 P = impulse * this.m_ax;
                const P: b2Vec2 = b2Vec2.Scale(impulse, this.m_ax, b2WheelJoint.SolveVelocityConstraints_s_P);
                const LA: number = impulse * this.m_sAx;
                const LB: number = impulse * this.m_sBx;

                // vA += mA * P;
                vA.AddScaled(mA, P);
                wA += iA * LA;
                // vB -= mB * P;
                vB.SubtractScaled(mB, P);
                wB -= iB * LB;
            }
        }

        // Solve point to line constraint
        {
            const Cdot: number =
                b2Vec2.Dot(this.m_ay, b2Vec2.Subtract(vB, vA, b2Vec2.s_t0)) + this.m_sBy * wB - this.m_sAy * wA;
            const impulse: number = -this.m_mass * Cdot;
            this.m_impulse += impulse;

            // b2Vec2 P = impulse * m_ay;
            const P: b2Vec2 = b2Vec2.Scale(impulse, this.m_ay, b2WheelJoint.SolveVelocityConstraints_s_P);
            const LA: number = impulse * this.m_sAy;
            const LB: number = impulse * this.m_sBy;

            // vA -= mA * P;
            vA.SubtractScaled(mA, P);
            wA -= iA * LA;

            // vB += mB * P;
            vB.AddScaled(mB, P);
            wB += iB * LB;
        }

        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }

    private static SolvePositionConstraints_s_d = new b2Vec2();

    private static SolvePositionConstraints_s_P = new b2Vec2();

    public SolvePositionConstraints(data: b2SolverData): boolean {
        const cA: b2Vec2 = data.positions[this.m_indexA].c;
        let aA: number = data.positions[this.m_indexA].a;
        const cB: b2Vec2 = data.positions[this.m_indexB].c;
        let aB: number = data.positions[this.m_indexB].a;

        // const qA: b2Rot = this.m_qA.Set(aA), qB: b2Rot = this.m_qB.Set(aB);

        // // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        // b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        // const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
        // // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        // b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        // const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
        // // b2Vec2 d = (cB - cA) + rB - rA;
        // const d: b2Vec2 = b2Vec2.Add(
        //   b2Vec2.Subtract(cB, cA, b2Vec2.s_t0),
        //   b2Vec2.Subtract(rB, rA, b2Vec2.s_t1),
        //   b2WheelJoint.SolvePositionConstraints_s_d);

        // // b2Vec2 ay = b2Mul(qA, m_localYAxisA);
        // const ay: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_localYAxisA, this.m_ay);

        // // float32 sAy = b2Cross(d + rA, ay);
        // const sAy = b2Vec2.Cross(b2Vec2.Add(d, rA, b2Vec2.s_t0), ay);
        // // float32 sBy = b2Cross(rB, ay);
        // const sBy = b2Vec2.Cross(rB, ay);

        // // float32 C = b2Dot(d, ay);
        // const C: number = b2Vec2.Dot(d, this.m_ay);

        // const k: number = this.m_invMassA + this.m_invMassB + this.m_invIA * this.m_sAy * this.m_sAy + this.m_invIB * this.m_sBy * this.m_sBy;

        // let impulse: number;
        // if (k !== 0) {
        //   impulse = - C / k;
        // } else {
        //   impulse = 0;
        // }

        // // b2Vec2 P = impulse * ay;
        // const P: b2Vec2 = b2Vec2.Scale(impulse, ay, b2WheelJoint.SolvePositionConstraints_s_P);
        // const LA: number = impulse * sAy;
        // const LB: number = impulse * sBy;

        // // cA -= m_invMassA * P;
        // cA.SubtractScaled(this.m_invMassA, P);
        // aA -= this.m_invIA * LA;
        // // cB += m_invMassB * P;
        // cB.AddScaled(this.m_invMassB, P);
        // aB += this.m_invIB * LB;

        let linearError = 0.0;

        if (this.m_enableLimit) {
            // b2Rot qA(aA), qB(aB);
            const qA: b2Rot = this.m_qA.Set(aA);
            const qB: b2Rot = this.m_qB.Set(aB);

            // b2Vec2 rA = b2Mul(qA, this.m_localAnchorA - this.m_localCenterA);
            // b2Vec2 rB = b2Mul(qB, this.m_localAnchorB - this.m_localCenterB);
            // b2Vec2 d = (cB - cA) + rB - rA;

            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
            b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
            const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
            b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
            const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
            // b2Vec2 d = (cB - cA) + rB - rA;
            const d: b2Vec2 = b2Vec2.Add(
                b2Vec2.Subtract(cB, cA, b2Vec2.s_t0),
                b2Vec2.Subtract(rB, rA, b2Vec2.s_t1),
                b2WheelJoint.SolvePositionConstraints_s_d,
            );

            // b2Vec2 ax = b2Mul(qA, this.m_localXAxisA);
            const ax: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_localXAxisA, this.m_ax);
            // float sAx = b2Cross(d + rA, this.m_ax);
            const sAx = b2Vec2.Cross(b2Vec2.Add(d, rA, b2Vec2.s_t0), this.m_ax);
            // float sBx = b2Cross(rB, this.m_ax);
            const sBx = b2Vec2.Cross(rB, this.m_ax);

            let C = 0.0;
            const translation: number = b2Vec2.Dot(ax, d);
            if (Math.abs(this.m_upperTranslation - this.m_lowerTranslation) < 2.0 * b2_linearSlop) {
                C = translation;
            } else if (translation <= this.m_lowerTranslation) {
                C = Math.min(translation - this.m_lowerTranslation, 0.0);
            } else if (translation >= this.m_upperTranslation) {
                C = Math.max(translation - this.m_upperTranslation, 0.0);
            }

            if (C !== 0.0) {
                const invMass: number =
                    this.m_invMassA + this.m_invMassB + this.m_invIA * sAx * sAx + this.m_invIB * sBx * sBx;
                let impulse = 0.0;
                if (invMass !== 0.0) {
                    impulse = -C / invMass;
                }

                const P: b2Vec2 = b2Vec2.Scale(impulse, ax, b2WheelJoint.SolvePositionConstraints_s_P);
                const LA: number = impulse * sAx;
                const LB: number = impulse * sBx;

                // cA -= m_invMassA * P;
                cA.SubtractScaled(this.m_invMassA, P);
                aA -= this.m_invIA * LA;
                // cB += m_invMassB * P;
                cB.AddScaled(this.m_invMassB, P);
                // aB += m_invIB * LB;
                aB += this.m_invIB * LB;

                linearError = Math.abs(C);
            }
        }

        // Solve perpendicular constraint
        {
            // b2Rot qA(aA), qB(aB);
            const qA: b2Rot = this.m_qA.Set(aA);
            const qB: b2Rot = this.m_qB.Set(aB);

            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
            // b2Vec2 d = (cB - cA) + rB - rA;

            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
            b2Vec2.Subtract(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
            const rA: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_lalcA, this.m_rA);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
            b2Vec2.Subtract(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
            const rB: b2Vec2 = b2Rot.MultiplyVec2(qB, this.m_lalcB, this.m_rB);
            // b2Vec2 d = (cB - cA) + rB - rA;
            const d: b2Vec2 = b2Vec2.Add(
                b2Vec2.Subtract(cB, cA, b2Vec2.s_t0),
                b2Vec2.Subtract(rB, rA, b2Vec2.s_t1),
                b2WheelJoint.SolvePositionConstraints_s_d,
            );

            // b2Vec2 ay = b2Mul(qA, m_localYAxisA);
            const ay: b2Vec2 = b2Rot.MultiplyVec2(qA, this.m_localYAxisA, this.m_ay);

            // float sAy = b2Cross(d + rA, ay);
            const sAy = b2Vec2.Cross(b2Vec2.Add(d, rA, b2Vec2.s_t0), ay);
            // float sBy = b2Cross(rB, ay);
            const sBy = b2Vec2.Cross(rB, ay);

            // float C = b2Dot(d, ay);
            const C: number = b2Vec2.Dot(d, ay);

            const invMass: number =
                this.m_invMassA +
                this.m_invMassB +
                this.m_invIA * this.m_sAy * this.m_sAy +
                this.m_invIB * this.m_sBy * this.m_sBy;

            let impulse = 0.0;
            if (invMass !== 0.0) {
                impulse = -C / invMass;
            }

            // b2Vec2 P = impulse * ay;
            // const LA: number = impulse * sAy;
            // const LB: number = impulse * sBy;
            const P: b2Vec2 = b2Vec2.Scale(impulse, ay, b2WheelJoint.SolvePositionConstraints_s_P);
            const LA: number = impulse * sAy;
            const LB: number = impulse * sBy;

            // cA -= m_invMassA * P;
            cA.SubtractScaled(this.m_invMassA, P);
            aA -= this.m_invIA * LA;
            // cB += m_invMassB * P;
            cB.AddScaled(this.m_invMassB, P);
            aB += this.m_invIB * LB;

            linearError = Math.max(linearError, Math.abs(C));
        }

        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;

        return linearError <= b2_linearSlop;
    }

    public GetDefinition(def: b2WheelJointDef): b2WheelJointDef {
        // DEBUG: b2Assert(false); // TODO
        return def;
    }

    public GetAnchorA<T extends XY>(out: T): T {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }

    public GetAnchorB<T extends XY>(out: T): T {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }

    public GetReactionForce<T extends XY>(inv_dt: number, out: T): T {
        // return inv_dt * (m_impulse * m_ay + m_springImpulse * m_ax);
        out.x = inv_dt * (this.m_impulse * this.m_ay.x + this.m_springImpulse * this.m_ax.x);
        out.y = inv_dt * (this.m_impulse * this.m_ay.y + this.m_springImpulse * this.m_ax.y);
        return out;
    }

    public GetReactionTorque(inv_dt: number): number {
        return inv_dt * this.m_motorImpulse;
    }

    public GetLocalAnchorA(): Readonly<b2Vec2> {
        return this.m_localAnchorA;
    }

    public GetLocalAnchorB(): Readonly<b2Vec2> {
        return this.m_localAnchorB;
    }

    public GetLocalAxisA(): Readonly<b2Vec2> {
        return this.m_localXAxisA;
    }

    public GetJointTranslation(): number {
        return this.GetPrismaticJointTranslation();
    }

    public GetJointLinearSpeed(): number {
        return this.GetPrismaticJointSpeed();
    }

    public GetJointAngle(): number {
        return this.GetRevoluteJointAngle();
    }

    public GetJointAngularSpeed(): number {
        return this.GetRevoluteJointSpeed();
    }

    public GetPrismaticJointTranslation(): number {
        const bA: b2Body = this.m_bodyA;
        const bB: b2Body = this.m_bodyB;

        const pA: b2Vec2 = bA.GetWorldPoint(this.m_localAnchorA, new b2Vec2());
        const pB: b2Vec2 = bB.GetWorldPoint(this.m_localAnchorB, new b2Vec2());
        const d: b2Vec2 = b2Vec2.Subtract(pB, pA, new b2Vec2());
        const axis: b2Vec2 = bA.GetWorldVector(this.m_localXAxisA, new b2Vec2());

        const translation: number = b2Vec2.Dot(d, axis);
        return translation;
    }

    public GetPrismaticJointSpeed(): number {
        const bA: b2Body = this.m_bodyA;
        const bB: b2Body = this.m_bodyB;

        // b2Vec2 rA = b2Mul(bA.m_xf.q, m_localAnchorA - bA.m_sweep.localCenter);
        b2Vec2.Subtract(this.m_localAnchorA, bA.m_sweep.localCenter, this.m_lalcA);
        const rA = b2Rot.MultiplyVec2(bA.m_xf.q, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(bB.m_xf.q, m_localAnchorB - bB.m_sweep.localCenter);
        b2Vec2.Subtract(this.m_localAnchorB, bB.m_sweep.localCenter, this.m_lalcB);
        const rB = b2Rot.MultiplyVec2(bB.m_xf.q, this.m_lalcB, this.m_rB);
        // b2Vec2 pA = bA.m_sweep.c + rA;
        const pA = b2Vec2.Add(bA.m_sweep.c, rA, b2Vec2.s_t0); // pA uses s_t0
        // b2Vec2 pB = bB.m_sweep.c + rB;
        const pB = b2Vec2.Add(bB.m_sweep.c, rB, b2Vec2.s_t1); // pB uses s_t1
        // b2Vec2 d = pB - pA;
        const d = b2Vec2.Subtract(pB, pA, b2Vec2.s_t2); // d uses s_t2
        // b2Vec2 axis = b2Mul(bA.m_xf.q, m_localXAxisA);
        const axis = bA.GetWorldVector(this.m_localXAxisA, new b2Vec2());

        const vA = bA.m_linearVelocity;
        const vB = bB.m_linearVelocity;
        const wA = bA.m_angularVelocity;
        const wB = bB.m_angularVelocity;

        // float32 speed = b2Dot(d, b2Cross(wA, axis)) + b2Dot(axis, vB + b2Cross(wB, rB) - vA - b2Cross(wA, rA));
        const speed =
            b2Vec2.Dot(d, b2Vec2.CrossScalarVec2(wA, axis, b2Vec2.s_t0)) +
            b2Vec2.Dot(
                axis,
                b2Vec2.Subtract(
                    b2Vec2.AddCrossScalarVec2(vB, wB, rB, b2Vec2.s_t0),
                    b2Vec2.AddCrossScalarVec2(vA, wA, rA, b2Vec2.s_t1),
                    b2Vec2.s_t0,
                ),
            );
        return speed;
    }

    public GetRevoluteJointAngle(): number {
        // b2Body* bA = this.m_bodyA;
        // b2Body* bB = this.m_bodyB;
        // return bB.this.m_sweep.a - bA.this.m_sweep.a;
        return this.m_bodyB.m_sweep.a - this.m_bodyA.m_sweep.a;
    }

    public GetRevoluteJointSpeed(): number {
        const wA: number = this.m_bodyA.m_angularVelocity;
        const wB: number = this.m_bodyB.m_angularVelocity;
        return wB - wA;
    }

    public IsMotorEnabled(): boolean {
        return this.m_enableMotor;
    }

    public EnableMotor(flag: boolean): void {
        if (flag !== this.m_enableMotor) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_enableMotor = flag;
        }
    }

    public SetMotorSpeed(speed: number): void {
        if (speed !== this.m_motorSpeed) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_motorSpeed = speed;
        }
    }

    public SetMaxMotorTorque(force: number): void {
        if (force !== this.m_maxMotorTorque) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_maxMotorTorque = force;
        }
    }

    public GetMotorTorque(inv_dt: number): number {
        return inv_dt * this.m_motorImpulse;
    }

    /// Is the joint limit enabled?
    public IsLimitEnabled(): boolean {
        return this.m_enableLimit;
    }

    /// Enable/disable the joint translation limit.
    public EnableLimit(flag: boolean): void {
        if (flag !== this.m_enableLimit) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_enableLimit = flag;
            this.m_lowerImpulse = 0.0;
            this.m_upperImpulse = 0.0;
        }
    }

    /// Get the lower joint translation limit, usually in meters.
    public GetLowerLimit(): number {
        return this.m_lowerTranslation;
    }

    /// Get the upper joint translation limit, usually in meters.
    public GetUpperLimit(): number {
        return this.m_upperTranslation;
    }

    /// Set the joint translation limits, usually in meters.
    public SetLimits(lower: number, upper: number): void {
        // b2Assert(lower <= upper);
        if (lower !== this.m_lowerTranslation || upper !== this.m_upperTranslation) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_lowerTranslation = lower;
            this.m_upperTranslation = upper;
            this.m_lowerImpulse = 0.0;
            this.m_upperImpulse = 0.0;
        }
    }
}
