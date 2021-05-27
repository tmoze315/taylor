import axios from "axios";
import { MessageEmbed } from "discord.js";
import { sample, upperFirst } from "lodash";
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
                .setThumbnail('https://i.imgur.com/7IhNJ4s.jpg')
                .setColor('#FBCFE8');

            return DiscordService.send(guildId, channelId, message);
        } catch (error) {
            console.error(error);

            return DiscordService.send(guildId, channelId, makeErrorMessage('Oops, something went wrong and I wasn\'t able to get your horoscope for today. Please try again later.'));
        }
    }

    async crystalBall(question: string) {
        const guildId = this.message.guildId();
        const channelId = this.message.channelId();
        const cleanQuestion = question.trim();

        if (!cleanQuestion || cleanQuestion === '') {
            return DiscordService.send(guildId, channelId, makeErrorMessage(`Please provide a question for me to answer. For example:\n\n\`?t crystalball Should I go for a walk?\``));
        }

        const availableAnswers = {
            yes: [
                'Certainly!',
                'Yeah, I think so.',
                'Without a doubt 😉.',
                'Yes definitely!',
                'Aw go for it!',
                '100% baby',
                'I *think* so...',
                'The outlook is looking good, just like you',
                'Yeah',
                'Why not!',
            ],
            maybe: [
                'I\'m not really sure, sorry. Try again?',
                'Ask again later, I\'m just about to go on stage!',
                'Can we do this another time maybe?',
                'That\'s a hard one. What do you think?',
                'Can you rephrase that please?',
            ],
            no: [
                'Don\'t count on it honey.',
                'Sorry, it\'s a no from me.',
                'My friends said no 😕',
                'It doesn\'t look good from here.',
                'It\'s a little unlikely...',
            ],
        };

        const type = sample(['yes', 'maybe', 'no']);

        if (!type) {
            return;
        }

        const answer = sample((availableAnswers as any)[type]);

        const message = new MessageEmbed()
            .setDescription(`**"${cleanQuestion}"**\n\n🔮 - ${answer}`)
            .setThumbnail('https://i.imgur.com/7IhNJ4s.jpg')
            .setColor('#FBCFE8');

        return DiscordService.send(guildId, channelId, message);
    }
}

export { HoroscopeCommands };
