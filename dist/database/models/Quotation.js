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
exports.Quotation = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const PartRequest_1 = require("./PartRequest");
const Supplier_1 = require("./Supplier");
let Quotation = class Quotation extends sequelize_typescript_1.Model {
};
exports.Quotation = Quotation;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Default)(sequelize_typescript_1.DataType.UUIDV4),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], Quotation.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => PartRequest_1.PartRequest),
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], Quotation.prototype, "request_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => PartRequest_1.PartRequest),
    __metadata("design:type", PartRequest_1.PartRequest)
], Quotation.prototype, "partRequest", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Supplier_1.Supplier),
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], Quotation.prototype, "supplier_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Supplier_1.Supplier),
    __metadata("design:type", Supplier_1.Supplier)
], Quotation.prototype, "supplier", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], Quotation.prototype, "price", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], Quotation.prototype, "lead_time_days", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DATEONLY),
    __metadata("design:type", String)
], Quotation.prototype, "valid_until", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(false),
    (0, sequelize_typescript_1.Default)('PENDING'),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Quotation.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.AllowNull)(true),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Quotation.prototype, "notes", void 0);
__decorate([
    (0, sequelize_typescript_1.Default)(0),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], Quotation.prototype, "shipping_cost", void 0);
exports.Quotation = Quotation = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'quotations', timestamps: true, underscored: true })
], Quotation);
