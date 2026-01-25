"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const invites_controller_1 = require("./invites.controller");
const invites_service_1 = require("./invites.service");
const waiting_list_controller_1 = require("./waiting-list.controller");
const invite_entity_1 = require("../entities/invite.entity");
const user_entity_1 = require("../entities/user.entity");
const waiting_list_entity_1 = require("../entities/waiting-list.entity");
const system_setting_entity_1 = require("../entities/system-setting.entity");
let InvitesModule = class InvitesModule {
};
exports.InvitesModule = InvitesModule;
exports.InvitesModule = InvitesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([invite_entity_1.Invite, user_entity_1.User, waiting_list_entity_1.WaitingList, system_setting_entity_1.SystemSetting]),
        ],
        controllers: [invites_controller_1.InvitesController, invites_controller_1.AdminInvitesController, waiting_list_controller_1.WaitingListController],
        providers: [invites_service_1.InvitesService],
        exports: [invites_service_1.InvitesService],
    })
], InvitesModule);
//# sourceMappingURL=invites.module.js.map