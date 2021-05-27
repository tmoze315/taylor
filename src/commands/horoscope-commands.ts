import axios from "axios";
import { MessageEmbed } from "discord.js";
import { upperFirst } from "lodash";
import { ray } from "node-ray";
import { makeErrorMessage } from "../messages/error";
import { DiscordService } from "../services/discord-service";
import BaseCommands from "./base-commands";

class HoroscopeCommands extends BaseCommands {
    async getHoroscope(sign: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const cleanSign = sign.trim().toLowerCase();

        const validSigns = [
            'aries',
            'taurus',
            'gemini',
            'cancer',
            'leo',
            'virgo',
            'libra',
            'scorpio',
            'sagittarius',
            'capricorn',
            'aquarius',
            'pisces'
        ];

        if (!cleanSign || cleanSign === '') {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`Please add a sign, for example: \`?t horoscope pisces\`\n\nThe supported signs are:\n${validSigns.join(', ')}`));
        }

        if (!validSigns.includes(cleanSign)) {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`Please use a valid sign. The supported signs are:\n\n${validSigns.join(', ')}`));
        }

        try {
            const response = await axios.post(`https://aztro.sameerkumar.website/?sign=${cleanSign}&day=today`);

            const results = response?.data;

            if (!results || !results.description) {
                return;
            }

            const message = new MessageEmbed()
                .setTitle(`${upperFirst(sign.trim())}`)
                .setDescription(results.description)
                .addField('Color', results.color, true)
                .addField('Compatibility', results.compatibility, true)
                .addField('Lucky Number', results.lucky_number, true)
                .addField('Mood', results.mood, true)
                .setColor('#FBCFE8');

            return DiscordService.send(guildId, channelId, message);
        } catch (error) {
            console.error(error);

            return DiscordService.send(guildId, channelId, makeErrorMessage('Oops, something went wrong and I wasn\'t able to get your horoscope for today. Please try again later.'));
        }
    }
}

export { HoroscopeCommands };
