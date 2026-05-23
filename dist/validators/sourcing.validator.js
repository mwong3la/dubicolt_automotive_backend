"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateSourcingRequest = validateCreateSourcingRequest;
exports.validateOfficialQuote = validateOfficialQuote;
const AppError_1 = require("../errors/AppError");
function validateCreateSourcingRequest(body) {
    const details = {};
    if (!body.product_name || !String(body.product_name).trim()) {
        details.product_name = ['Required'];
    }
    if (!body.description || String(body.description).length < 20) {
        details.description = ['Description must be at least 20 characters'];
    }
    const county = body.county ?? body.destination;
    if (!county || !String(county).trim()) {
        details.county = ['Select a county'];
    }
    if (!body.delivery_address || !String(body.delivery_address).trim()) {
        details.delivery_address = ['Enter a delivery address'];
    }
    if (!body.budget || !String(body.budget).trim()) {
        details.budget = ['Budget is required'];
    }
    if (!body.quantity)
        details.quantity = ['Required'];
    if (!body.target_date)
        details.target_date = ['Required'];
    if (!body.accept_terms)
        details.accept_terms = ['You must accept terms'];
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return body;
}
function validateOfficialQuote(body) {
    const details = {};
    if (!body.unit_price)
        details.unit_price = ['Required'];
    if (!body.transport)
        details.transport = ['Required'];
    if (!body.lead_time_days)
        details.lead_time_days = ['Required'];
    if (Object.keys(details).length) {
        throw new AppError_1.AppError(400, 'validation_error', 'Validation failed', details);
    }
    return body;
}
