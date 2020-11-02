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

import { b2Vec2, b2ChainShape, b2FixtureDef, b2BodyType, b2CircleShape, b2Body, b2RadToDeg, XY } from "@plane2d/core";
import {
    BlendFunc,
    ChainLight,
    ConeLight,
    DirectionalLight,
    Light,
    lightSettings,
    PointLight,
    RayHandler,
    RECOMMENDED_GAMMA_CORRECTION,
} from "@plane2d/lights";

import { g_camera } from "../../utils/camera";
import { g_debugDraw } from "../../utils/draw";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";
import { RayHandlerImpl } from "../../utils/lights/RayHandlerImpl";
import { PreloadedTextures } from "../../utils/gl/preload";
import { DefaultShader } from "../../utils/gl/defaultShader";
import { Sprite } from "../../utils/gl/Sprite";
import { clearGlCanvas } from "../../utils/gl/glUtils";
import { Settings } from "../../settings";
import { Test } from "../../test";
import { setRandomLightColor } from "../../utils/lights/lightUtils";

const bit = (index: number) => 1 << index;

const Category = {
    WORLD: bit(1),
    MARBLE: bit(2),
    LIGHT: bit(3),
};
const Mask = {
    WORLD: Category.MARBLE,
    MARBLE: Category.MARBLE | Category.WORLD | Category.LIGHT,
    LIGHT: Category.MARBLE,
};

const RADIUS = 1;
const SIZE = RADIUS * 2;
const RAYS_PER_BALL = 128;
const LIGHT_DISTANCE = 16;
const viewportWidth = 48;
const viewportHeight = 33;

export class Marble {
    public light!: Light;

    public constructor(public readonly sprite: Sprite, public readonly body: b2Body) {}

    public render() {
        const pos = this.body.GetPosition();
        this.sprite.setRotatedRect(
            pos.x - RADIUS,
            pos.y - RADIUS,
            SIZE,
            SIZE,
            b2RadToDeg(this.body.GetAngle()),
            RADIUS,
            RADIUS,
        );
        this.sprite.render();
    }
}

enum LightsType {
    NONE,
    POINT,
    CONE,
    CHAIN,
    DIRECTIONAL,
}

function random(from: number, to: number) {
    return from + Math.random() * (to - from);
}

export class OfficialDemo extends Test {
    private readonly bg: Sprite;

    private readonly marbles: Marble[];

    private groundBody!: b2Body;

    private readonly rayHandler: RayHandler;

    private sunDirection = -90;

    private lightsType!: LightsType;

    directionalLight: DirectionalLight | null = null;

    blendFunc: BlendFunc;

    drawDebugLight = false;

    soft = true;

    mode: "default" | "overburn" | "other" = "default";

    public constructor(
        public readonly gl: WebGLRenderingContext,
        public readonly shader: DefaultShader,
        public readonly textures: PreloadedTextures,
    ) {
        super({ x: 0, y: 0 });
        this.blendFunc = new BlendFunc(gl, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.bg = new Sprite(gl, this.shader, textures.bg.texture);

        this.createBoundary();

        const ballShape = new b2CircleShape(RADIUS);
        const def: b2FixtureDef = {
            restitution: 0.9,
            friction: 0.01,
            shape: ballShape,
            density: 1,
        };

        const createMarble = () => {
            // Create the BodyDef, set a random position above the
            // ground and create a new body
            const boxBody = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                position: {
                    x: 4 + Math.random() * 40,
                    y: 4 + Math.random() * 25,
                },
            });
            const fixture = boxBody.CreateFixture(def);
            fixture.m_filter.categoryBits = Category.MARBLE;
            fixture.m_filter.maskBits = Mask.MARBLE;
            fixture.SetFilterData(fixture.m_filter);
            return new Marble(new Sprite(gl, this.shader, textures.marble.texture), boxBody);
        };

        this.marbles = Array.from({ length: 5 }, createMarble);
        this.bg.setRect(0, 0, viewportWidth, viewportHeight);

        Light.setGlobalContactFilterBits(Category.LIGHT, 0, Mask.LIGHT);
        lightSettings.gammaCorrection = RECOMMENDED_GAMMA_CORRECTION;
        lightSettings.isDiffuse = true;

        this.rayHandler = new RayHandlerImpl(
            this.m_world,
            gl,
            g_camera.getWidth() / 4,
            g_camera.getHeight() / 4,
            viewportWidth,
            viewportHeight,
        );
        this.rayHandler.setAmbientLight(0, 0, 0, 0.5);
        this.rayHandler.setBlurNum(3);

        this.setLightsType(LightsType.POINT);
    }

    public GetDefaultViewZoom() {
        return 20;
    }

    public getCenter(): XY {
        return { x: viewportWidth / 2, y: viewportHeight / 2 };
    }

    public Resize(width: number, height: number) {
        this.rayHandler.resizeFBO(width / 4, height / 4);
    }

    public Destroy() {
        super.Destroy();

        this.bg.destroy();
        for (const marble of this.marbles) {
            marble.light.dispose();
            marble.sprite.destroy();
        }
        this.rayHandler.dispose();
        Light.setGlobalContactFilter(null);
    }

    private setLightsType(lightsType: LightsType) {
        if (this.lightsType !== lightsType) {
            switch (lightsType) {
                case LightsType.POINT:
                    this.initPointLights();
                    break;
                case LightsType.CONE:
                    this.initConeLights();
                    break;
                case LightsType.CHAIN:
                    this.initChainLights();
                    break;
                case LightsType.DIRECTIONAL:
                    this.initDirectionalLight();
                    break;
            }
            this.lightsType = lightsType;
        }
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "1", "Point Light", () => this.setLightsType(LightsType.POINT)),
            hotKeyPress([], "2", "Cone Light", () => this.setLightsType(LightsType.CONE)),
            hotKeyPress([], "3", "Chain Light", () => this.setLightsType(LightsType.CHAIN)),
            hotKeyPress([], "4", "Directional Light", () => this.setLightsType(LightsType.DIRECTIONAL)),
            hotKeyPress([], "7", "Default Blending (1.3)", () => this.setBlending("default")),
            hotKeyPress([], "8", "Over-Burn Blending (default in 1.2)", () => this.setBlending("overburn")),
            hotKeyPress([], "9", "Some other Blending", () => this.setBlending("other")),
            hotKeyPress([], "c", "Random Light Colors", () => {
                for (const marble of this.marbles) {
                    setRandomLightColor(marble.light);
                }
            }),
            hotKeyPress([], "d", "Random Light Distance", () => {
                for (const marble of this.marbles) {
                    marble.light.setDistance(random(LIGHT_DISTANCE * 0.5, LIGHT_DISTANCE * 2));
                }
            }),
            hotKeyPress([], "l", "Toggle Light Debug Drawing", () => {
                this.drawDebugLight = !this.drawDebugLight;
            }),
            hotKeyPress([], "s", "Toggle Soft Shadows", () => {
                this.soft = !this.soft;
                this.directionalLight?.setSoft(this.soft);
                for (const marble of this.marbles) {
                    marble.light?.setSoft(this.soft);
                }
            }),
        ];
    }

    public setBlending(mode: "default" | "overburn" | "other") {
        this.mode = mode;
        if (mode === "overburn") this.rayHandler.diffuseBlendFunc.set(this.gl.DST_COLOR, this.gl.SRC_COLOR);
        else if (mode === "other") this.rayHandler.diffuseBlendFunc.set(this.gl.SRC_COLOR, this.gl.DST_COLOR);
        else this.rayHandler.diffuseBlendFunc.reset();
    }

    public Step(settings: Settings, timeStep: number): number {
        super.Step(settings, timeStep);

        this.addDebug("Blend Mode", this.mode);
        this.addDebug("Soft Shadows", this.soft);

        clearGlCanvas(this.gl, 0, 0, 0, 1);
        this.blendFunc.apply();
        this.bg.render();
        for (const marble of this.marbles) {
            marble.render();
        }

        /** Rotate directional light like sun :) */
        if (this.directionalLight) {
            this.sunDirection += timeStep * 0.008;
            this.directionalLight.setDirection(this.sunDirection);
        }

        this.rayHandler.setCombinedMatrix(
            g_camera.combined,
            viewportWidth / 2,
            viewportHeight / 2,
            viewportWidth,
            viewportHeight,
        );

        if (timeStep > 0) this.rayHandler.update();
        this.rayHandler.render();

        if (this.drawDebugLight) {
            const drawPolygon = g_debugDraw.DrawPolygon.bind(g_debugDraw);
            for (const light of this.rayHandler.lightList) light.debugRender(drawPolygon);
        }

        return timeStep;
    }

    private createBoundary() {
        const chainShape = new b2ChainShape();
        chainShape.CreateLoop([
            new b2Vec2(0, 0),
            new b2Vec2(0, viewportHeight),
            new b2Vec2(viewportWidth, viewportHeight),
            new b2Vec2(viewportWidth, 0),
        ]);
        this.groundBody = this.m_world.CreateBody({
            type: b2BodyType.b2_staticBody,
        });
        const fixture = this.groundBody.CreateFixture(chainShape, 0);
        fixture.m_filter.categoryBits = Category.WORLD;
        fixture.m_filter.maskBits = Mask.WORLD;
        fixture.Refilter();
    }

    private clearLights() {
        if (this.directionalLight) {
            this.directionalLight.remove();
            this.directionalLight = null;
        }
        for (const marble of this.marbles) {
            marble.light?.remove();
        }
    }

    private initPointLights() {
        this.clearLights();
        for (const marble of this.marbles) {
            const light = new PointLight(this.rayHandler, RAYS_PER_BALL, Light.DefaultColor, LIGHT_DISTANCE, 0, 0);
            light.attachToBody(marble.body, RADIUS / 2, RADIUS / 2);
            setRandomLightColor(light);
            marble.light = light;
            light.setSoft(this.soft);
        }
    }

    private initConeLights() {
        this.clearLights();
        for (const marble of this.marbles) {
            const light = new ConeLight(
                this.rayHandler,
                RAYS_PER_BALL,
                Light.DefaultColor,
                LIGHT_DISTANCE,
                0,
                0,
                0,
                random(15, 40),
            );
            light.attachToBody(marble.body, RADIUS / 2, RADIUS / 2, random(0, 360));
            setRandomLightColor(light);
            marble.light = light;
            light.setSoft(this.soft);
        }
    }

    private initChainLights() {
        this.clearLights();
        for (const marble of this.marbles) {
            const light = new ChainLight(this.rayHandler, RAYS_PER_BALL, Light.DefaultColor, LIGHT_DISTANCE, 1, [
                -5,
                0,
                0,
                3,
                5,
                0,
            ]);
            light.attachToBody(marble.body, random(0, 360));
            setRandomLightColor(light);
            marble.light = light;
            light.setSoft(this.soft);
        }
    }

    private initDirectionalLight() {
        this.clearLights();

        this.sunDirection = random(0, 360);

        this.directionalLight = new DirectionalLight(
            this.rayHandler,
            4 * RAYS_PER_BALL,
            Light.DefaultColor,
            this.sunDirection,
        );
        this.directionalLight.setSoftnessLength(5);
        this.directionalLight.setSoft(this.soft);
    }
}
