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

import { BlendFunc, Light, lightSettings, PointLight, RayHandler, RECOMMENDED_GAMMA_CORRECTION } from "@plane2d/lights";
import { b2Vec2, b2EdgeShape, b2Body, b2Fixture } from "@plane2d/core";

import { g_camera } from "../../utils/camera";
import { g_debugDraw } from "../../utils/draw";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";
import { RayHandlerImpl } from "../../utils/lights/RayHandlerImpl";
import { PreloadedTextures } from "../../utils/gl/preload";
import { DefaultShader } from "../../utils/gl/defaultShader";
import { clearGlCanvas } from "../../utils/gl/glUtils";
import { Settings } from "../../settings";
import { Test } from "../../test";
import { setRandomLightColor } from "../../utils/lights/lightUtils";
import heart from "./heart.json";

const NUM_RAYS = 512; // fixme: make a configurable setting?
const LIGHT_DISTANCE = 32;

export class DrawWorld extends Test {
    private readonly rayHandler: RayHandler;

    private mouseLight: PointLight;

    private lights: PointLight[] = [];

    blendFunc: BlendFunc;

    drawDebugLight = false;

    currentEdgeFixture: b2Fixture | null = null;

    currentEdgeBody: b2Body | null = null;

    dragStart = new b2Vec2();

    soft = true;

    mode: "default" | "overburn" = "default";

    public constructor(
        public readonly gl: WebGLRenderingContext,
        public readonly shader: DefaultShader,
        public readonly textures: PreloadedTextures,
    ) {
        super({ x: 0, y: 0 });
        this.blendFunc = new BlendFunc(gl, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        lightSettings.gammaCorrection = RECOMMENDED_GAMMA_CORRECTION;
        lightSettings.isDiffuse = true;

        this.rayHandler = new RayHandlerImpl(
            this.m_world,
            gl,
            g_camera.getWidth() / 4,
            g_camera.getHeight() / 4,
            g_camera.getWidth(),
            g_camera.getHeight(),
        );
        this.rayHandler.setAmbientLight(0, 0, 0, 0.5);
        this.rayHandler.setBlurNum(3);

        this.mouseLight = this.createLight();
        this.mouseLight.setColor(1, 0, 0, 1);
        this.setBlending("overburn");

        const heartBody = this.m_world.CreateBody();
        for (const line of heart) {
            const shape = new b2EdgeShape();
            shape.SetTwoSided({ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
            heartBody.CreateFixture({
                shape,
                density: 0.0,
                restitution: 0,
            });
        }
    }

    public createLight() {
        const light = new PointLight(this.rayHandler, NUM_RAYS, Light.DefaultColor, LIGHT_DISTANCE, 0, 0);
        setRandomLightColor(light);
        light.setPositionV(this.m_mouseWorld);
        light.setSoft(this.soft);
        return light;
    }

    public GetDefaultViewZoom() {
        return 30;
    }

    public Resize(width: number, height: number) {
        this.rayHandler.resizeFBO(width / 4, height / 4);
    }

    public Destroy() {
        super.Destroy();

        this.rayHandler.dispose();
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "7", "Default Blending (1.3)", () => this.setBlending("default")),
            hotKeyPress([], "8", "Over-Burn Blending (default in 1.2)", () => this.setBlending("overburn")),
            hotKeyPress([], "a", "Place current light", () => {
                this.lights.push(this.mouseLight);
                this.mouseLight = this.createLight();
            }),
            hotKeyPress([], "l", "Toggle Light Debug Drawing", () => {
                this.drawDebugLight = !this.drawDebugLight;
            }),
            hotKeyPress([], "s", "Toggle Soft Shadows", () => {
                this.soft = !this.soft;
                this.mouseLight.setSoft(this.soft);
                for (const light of this.lights) {
                    light.setSoft(this.soft);
                }
            }),
        ];
    }

    public setBlending(mode: "default" | "overburn") {
        this.mode = mode;
        if (mode === "overburn") this.rayHandler.diffuseBlendFunc.set(this.gl.DST_COLOR, this.gl.SRC_COLOR);
        else this.rayHandler.diffuseBlendFunc.reset();
    }

    public MouseDown(p: b2Vec2) {
        super.MouseDown(p);
        this.dragStart.Copy(p);
    }

    public MouseUp(p: b2Vec2) {
        super.MouseUp(p);
        this.currentEdgeFixture = null;
        this.currentEdgeBody = null;
    }

    public MouseMove(p: b2Vec2, leftDrag: boolean) {
        super.MouseMove(p, leftDrag);
        if (leftDrag) {
            if (!this.currentEdgeBody) {
                const dist = 1 / g_camera.getZoom();
                this.currentEdgeBody = this.m_world.CreateBody({
                    position: { x: -dist, y: dist },
                });
            }
            if (this.currentEdgeFixture) this.currentEdgeBody.DestroyFixture(this.currentEdgeFixture);
            const shape = new b2EdgeShape();
            shape.SetTwoSided(this.dragStart, p);
            this.currentEdgeFixture = this.currentEdgeBody.CreateFixture({
                shape,
                density: 0.0,
                restitution: 0,
            });
        }
    }

    public Step(settings: Settings, timeStep: number): number {
        super.Step(settings, timeStep);

        this.addText("Left drag to draw lines");
        this.addDebug("Blend Mode", this.mode);
        this.addDebug("Soft Shadows", this.soft);

        clearGlCanvas(this.gl, 1, 1, 1, 1);
        this.blendFunc.apply();

        this.mouseLight.setPositionV(this.m_mouseWorld);
        const center = g_camera.getCenter();
        this.rayHandler.setCombinedMatrix(
            g_camera.combined,
            center.x,
            center.y,
            g_camera.getWidth(),
            g_camera.getHeight(),
        );

        if (timeStep > 0) this.rayHandler.update();
        this.rayHandler.render();

        if (this.drawDebugLight) {
            const drawPolygon = g_debugDraw.DrawPolygon.bind(g_debugDraw);
            for (const light of this.rayHandler.lightList) light.debugRender(drawPolygon);
        }

        return timeStep;
    }
}
