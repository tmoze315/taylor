import { inject } from '@alexlafroscia/service-locator';
import { Client } from 'discord.js';
import { IMessage } from '../discord/message';
import { IConfig } from '../config/adventure';
import { IGuild } from '../models/Guild';
import { DiscordService } from '../services/discord-service';
import { sample } from 'lodash';

export default class SadListener {
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

        if (!content.includes('killed the baby duck')) {
            return;
        }

        const responses = [
            'https://media.giphy.com/media/Ces0zM8hZErBK/giphy.gif',
            'https://media.giphy.com/media/PjdsiTDWa60yjA0Az8/giphy.gif',
            'https://media.giphy.com/media/ApTACfgBR3Ql2/giphy.gif',
            'https://media.giphy.com/media/l2ZDPaRqwLJWl5QHu/giphy.gif',
            'https://media.giphy.com/media/w3j54RqQkzY9W/giphy.gif',

        ];

        const response = sample(responses);

        if (!response) {
            return;
        }

        return DiscordService.send(guildId, channelId, response);
    }
}
