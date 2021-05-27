import { inject } from '@alexlafroscia/service-locator';
import { Client, Message } from 'discord.js';
import { IMessage } from '../discord/message';
import { IConfig } from '../config/adventure';
import { IGuild } from '../models/Guild';
import { DiscordService } from '../services/discord-service';
import { Keyword } from '../models/Keyword';
import { sample } from 'lodash';
import slugify from 'slugify';

export default class KeyWordListener {
    @inject message: IMessage;
    @inject Config: IConfig;
    @inject client: Client | null;
    @inject guildMembers: any;
    @inject guild: IGuild;

    async handle() {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const user = this.message.original().author;

        if (this.message.isFromBot()) {
            return;
        }

        const content = this.message.content().trim().toLowerCase();

        const keywords = await Keyword.find({
            guildId: guildId,
            searchableKeyword: slugify(content, { lower: true, strict: true }),
        });

        if (!keywords || keywords.length <= 0) {
            return;
        }

        const keyword = keywords[0];

        let response = sample(keyword.responses);

        if (!response) {
            return;
        }

        response = response.replace('{user}', user.toString());

        return DiscordService.send(guildId, channelId, response);
    }
}
