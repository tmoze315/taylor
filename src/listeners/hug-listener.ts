import { inject } from '@alexlafroscia/service-locator';
import { Client, Message } from 'discord.js';
import { IMessage } from '../discord/message';
import { IConfig } from '../config/adventure';
import { IGuild } from '../models/Guild';
import { DiscordService } from '../services/discord-service';
import { Keyword } from '../models/Keyword';
import { sample } from 'lodash';
import slugify from 'slugify';
import { ray } from 'node-ray';

export default class HugListener {
    @inject message: IMessage;
    @inject Config: IConfig;
    @inject client: Client | null;
    @inject guildMembers: any;
    @inject guild: IGuild;

    async handle() {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();

        if (!this.message.isFromBot()) {
            return;
        }

        const content = this.message.content().trim().toLowerCase();

        if (!content.includes('hugged the duck in') && !content.includes('. they feel loved.')) {
            return;
        }

        const responses = [
            'https://media.giphy.com/media/3o85xmASAmici9Lk7C/giphy.gif',
            'https://media.giphy.com/media/3o85xqaAlB0QMfZmne/giphy.gif',
            'https://media.giphy.com/media/qu9xOEVxSDTy4WLup8/giphy.gif',
            'https://media.giphy.com/media/5QKtvVryyAAR7jJHHp/giphy.gif',
            'https://media.giphy.com/media/fpakjlMN495vi/giphy.gif',
        ];

        const response = sample(responses);

        if (!response) {
            return;
        }

        return DiscordService.send(guildId, channelId, response);
    }
}
