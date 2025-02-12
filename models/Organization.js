import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
    OrganizationName: {
        type: String,
        required: true,
        unique: true
    },
    OrganizationLogo: {
        type: String,
        required: true
    },
    OrganizationCode:{
        type: String,
        required: true,
        unique: true
    }
},

    { timestamps: true }

);

export const OrganizationModel = mongoose.model('Organization', OrganizationSchema);
