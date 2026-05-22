"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcingAttachment = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const SourcingRequest_1 = require("./SourcingRequest");
let SourcingAttachment = class SourcingAttachment extends sequelize_typescript_1.Model {
};
exports.SourcingAttachment = SourcingAttachment;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Default)(sequelize_typescript_1.DataType.UUIDV4),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => SourcingRequest_1.SourcingRequest),
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "sourcing_request_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => SourcingRequest_1.SourcingRequest),
    __metadata("design:type", SourcingRequest_1.SourcingRequest)
], SourcingAttachment.prototype, "sourcing_request", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "size", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ENUM('pdf', 'zip')),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], SourcingAttachment.prototype, "url", void 0);
exports.SourcingAttachment = SourcingAttachment = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'sourcing_attachments', timestamps: true, underscored: true })
], SourcingAttachment);
