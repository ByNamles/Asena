import { Collection } from 'discord.js';
import Language from './Language';
import { readdirSync } from 'fs';
import { sep } from 'path';
import SuperClient from '../SuperClient';
import TextFormat from '../utils/TextFormat';

export default class LanguageManager{

    private static languages: Collection<string, Language>

    private static LOCALE_PATH = `${process.cwd()}${sep}locales`
    private static DEFAULT_LANGUAGE = 'tr_TR'

    constructor(private client: SuperClient){}

    run(){
        const files = readdirSync(LanguageManager.LOCALE_PATH)
        if(!files.length) this.client.logger.error('Herhangi bir dil dosyası bulunamadı.')

        for(const file of files){
            if(!file.endsWith('.json')){
                this.client.logger.warning(`${file} adlı dil dosyası '.json' uzantısı ile bitmiyor.`)
                continue
            }

            const language = require(`${LanguageManager.LOCALE_PATH}${sep}${file}`)
            this.client.logger.info(`Dil başarıyla yüklendi: ${TextFormat.COLOR_WHITE}${language.full}`)

            const locale = new Language(language)
            LanguageManager.addLanguage(locale)

            if(locale.version.compare(this.client.version) === -1){
                if(locale.code === LanguageManager.DEFAULT_LANGUAGE){
                    this.client.logger.warning(`Varsayılan dil (${LanguageManager.DEFAULT_LANGUAGE}) sürümü eski. Lütfen dil sürümünü güncelleyin.`)
                    process.exit(1)
                }else{
                    this.client.logger.warning(`${language.full} dilinin sürümü eski. Eksik anahtarlar varsayılan dilden sağlanacak.`)
                }
            }
        }

        if(!LanguageManager.languages.get(LanguageManager.DEFAULT_LANGUAGE)){
            this.client.logger.error(`Varsayılan dil (${LanguageManager.DEFAULT_LANGUAGE}) yüklenemedi.`)
            process.exit(1)
        }

        this.client.logger.info(`${TextFormat.COLOR_GREEN}Toplam ${TextFormat.COLOR_PURPLE}${LanguageManager.languages.size} ${TextFormat.COLOR_GREEN}dil başarıyla yüklendi!`)
    }

    private static addLanguage(locale: Language){
        this.languages.set(locale.code, locale)
    }

    private static getLanguage(code: string): Language{
        return this.languages.find(lang => lang.code === code || lang.aliases.includes(code)) ?? this.languages.get(LanguageManager.DEFAULT_LANGUAGE)
    }

    public static translate(code: string, key: string, args: Array<string | number>){
        const translated = this.getLanguage(code).translate(key, args)
        if(!translated){
            return this.getLanguage(this.DEFAULT_LANGUAGE).translate(key, args)
        }

        return translated
    }

}
