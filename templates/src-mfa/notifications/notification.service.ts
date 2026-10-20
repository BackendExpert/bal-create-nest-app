import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Notification, NotificationDocument, NotificationType } from "./schema/notification.schema";
import { Model, Types } from "mongoose";
import { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";
import { User, UserDocument } from "src/user/schema/user.schema";


@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<NotificationDocument>,

        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    async CreateNotfication(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        createdBy?: string,
        data?: Record<string, unknown>,
    ) {
        const notification = await this.notificationModel.create({
            userId: new Types.ObjectId(userId),
            type,
            title,
            message,
            isRead: false,
            createdBy: createdBy ? new Types.ObjectId(createdBy) : null,
            data: data || null,
        });

        return notification;
    }

    async ReadNotification(
        user: AuthenticatedUser,
        notificationId: string,
    ) {
        const notification = await this.notificationModel.findOneAndUpdate(
            {
                _id: notificationId,
                userId: new Types.ObjectId(user.id),
            },
            {
                isRead: true,
            },
            { new: true }
        );

        if (!notification) {
            throw new NotFoundException("The Notification Cannot be found");
        }
        return {
            success: true,
            message: "Notication Read Success"
        }
    }

    async FetchNotifications(
        user: AuthenticatedUser,
    ) {
        const getuser = await this.userModel.findById(user.id)

        if (!getuser) {
            throw new NotFoundException("The User cannot be found")
        }

        const notfications = await this.notificationModel.find({
            userId: user.id
        })

        return {
            success: true,
            message: "Notifications Fetched Success",
            result: notfications
        }
    }

}