/*
* Copyright (c) 2011 Erin Catto http://box2d.org
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

import { b2Vec2, b2Transform } from "./b2Math";

/// Color for debug drawing. Each value has the range [0,1].
export class b2Color {
  public static RED: b2Color = new b2Color(1, 0, 0);
  public static GREEN: b2Color = new b2Color(0, 1, 0);
  public static BLUE: b2Color = new b2Color(0, 0, 1);

  public r: number = 0.5;
  public g: number = 0.5;
  public b: number = 0.5;
  public a: number = 1.0;

  constructor(rr: number, gg: number, bb: number, aa: number = 1.0) {
    this.r = rr;
    this.g = gg;
    this.b = bb;
    this.a = aa;
  }

  public SetRGB(rr: number, gg: number, bb: number): b2Color {
    this.r = rr;
    this.g = gg;
    this.b = bb;
    return this;
  }

  public MakeStyleString(alpha: number = this.a): string {
    const r = Math.round(Math.max(0, Math.min(255, this.r * 255)));
    const g = Math.round(Math.max(0, Math.min(255, this.g * 255)));
    const b = Math.round(Math.max(0, Math.min(255, this.b * 255)));
    const a = Math.max(0, Math.min(1, alpha));
    return b2Color.MakeStyleString(r, g, b, a);
  }

  public static MakeStyleString(r: number, g: number, b: number, a: number = 1.0): string {
    if (a < 1.0) {
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    } else {
      return "rgb(" + r + "," + g + "," + b + ")";
    }
  }
}

export const enum b2DrawFlags {
  e_none = 0,
  e_shapeBit = 0x0001, ///< draw shapes
  e_jointBit = 0x0002, ///< draw joint connections
  e_aabbBit = 0x0004, ///< draw axis aligned bounding boxes
  e_pairBit = 0x0008, ///< draw broad-phase pairs
  e_centerOfMassBit = 0x0010, ///< draw center of mass frame
  e_controllerBit = 0x0020, /// @see b2Controller list
  e_all = 0x003f
}

/// Implement and register this class with a b2World to provide debug drawing of physics
/// entities in your game.
export class b2Draw {
  public m_drawFlags: b2DrawFlags = 0;

  public SetFlags(flags: b2DrawFlags): void {
    this.m_drawFlags = flags;
  }

  public GetFlags(): b2DrawFlags {
    return this.m_drawFlags;
  }

  public AppendFlags(flags: b2DrawFlags): void {
    this.m_drawFlags |= flags;
  }

  public ClearFlags(flags: b2DrawFlags): void {
    this.m_drawFlags &= ~flags;
  }

  public PushTransform(xf: b2Transform): void {}

  public PopTransform(xf: b2Transform): void {}

  public DrawPolygon(vertices: b2Vec2[], vertexCount: number, color: b2Color): void {}

  public DrawSolidPolygon(vertices: b2Vec2[], vertexCount: number, color: b2Color): void {}

  public DrawCircle(center: b2Vec2, radius: number, color: b2Color): void {}

  public DrawSolidCircle(center: b2Vec2, radius: number, axis: b2Vec2, color: b2Color): void {}

  public DrawSegment(p1: b2Vec2, p2: b2Vec2, color: b2Color): void {}

  public DrawTransform(xf: b2Transform): void {}
}
