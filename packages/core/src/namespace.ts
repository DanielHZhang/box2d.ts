/*
 * Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
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

/**
 * \mainpage Box2D API Documentation
 * \section intro_sec Getting Started
 * For documentation please see http://box2d.org/documentation.html
 * For discussion please visit http://box2d.org/forum
 */

// These include files constitute the main Box2D API

export * from "./common/b2_common";
export * from "./common/b2_settings";
export * from "./common/b2_math";
export * from "./common/b2_draw";
export * from "./common/b2_draw_helper";
export * from "./common/b2_timer";
export * from "./common/b2_augment";

export * from "./collision/b2_collision";
export * from "./collision/b2_distance";
export * from "./collision/b2_broad_phase";
export * from "./collision/b2_dynamic_tree";
export * from "./collision/b2_time_of_impact";
export * from "./collision/b2_collide_circle";
export * from "./collision/b2_collide_polygon";
export * from "./collision/b2_collide_edge";

export * from "./collision/b2_shape";
export * from "./collision/b2_circle_shape";
export * from "./collision/b2_polygon_shape";
export * from "./collision/b2_edge_shape";
export * from "./collision/b2_chain_shape";

export * from "./dynamics/b2_fixture";
export { b2Body, b2BodyType, b2BodyDef } from "./dynamics/b2_body";
export { b2World } from "./dynamics/b2_world";
export * from "./dynamics/b2_world_callbacks";
export * from "./dynamics/b2_island";
export * from "./dynamics/b2_time_step";
export * from "./dynamics/b2_contact_manager";

export * from "./dynamics/b2_contact";
export * from "./dynamics/b2_contact_factory";
export * from "./dynamics/b2_contact_solver";
export * from "./dynamics/b2_circle_contact";
export * from "./dynamics/b2_polygon_contact";
export * from "./dynamics/b2_polygon_circle_contact";
export * from "./dynamics/b2_edge_circle_contact";
export * from "./dynamics/b2_edge_polygon_contact";
export * from "./dynamics/b2_chain_circle_contact";
export * from "./dynamics/b2_chain_polygon_contact";

export * from "./dynamics/b2_joint";
export * from "./dynamics/b2_area_joint";
export * from "./dynamics/b2_distance_joint";
export * from "./dynamics/b2_friction_joint";
export * from "./dynamics/b2_gear_joint";
export * from "./dynamics/b2_motor_joint";
export * from "./dynamics/b2_mouse_joint";
export * from "./dynamics/b2_prismatic_joint";
export * from "./dynamics/b2_pulley_joint";
export * from "./dynamics/b2_revolute_joint";
export * from "./dynamics/b2_rope_joint";
export * from "./dynamics/b2_weld_joint";
export * from "./dynamics/b2_wheel_joint";

export * from "./rope/b2_rope";
