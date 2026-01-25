"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const keeps_controller_1 = require("./keeps.controller");
const keeps_service_1 = require("./keeps.service");
const keep_entity_1 = require("../entities/keep.entity");
const post_entity_1 = require("../entities/post.entity");
const collection_item_entity_1 = require("../entities/collection-item.entity");
let KeepsModule = class KeepsModule {
};
exports.KeepsModule = KeepsModule;
exports.KeepsModule = KeepsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([keep_entity_1.Keep, post_entity_1.Post, collection_item_entity_1.CollectionItem])],
        controllers: [keeps_controller_1.KeepsController],
        providers: [keeps_service_1.KeepsService],
    })
], KeepsModule);
//# sourceMappingURL=keeps.module.js.map