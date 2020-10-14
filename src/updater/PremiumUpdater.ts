import amqp from 'amqplib/callback_api'
import Factory from '../Factory';
import { RabbitMQ } from '../Constants';
import Premium from '../structures/Premium';
import { PremiumStatus } from '../models/Premium';

export default class PremiumUpdater extends Factory{

    start(){
        amqp.connect(process.env.AMQP_CONN_URL, (err, connection) => {
            if(err){
                this.client.logger.error(`RabbitMQ sunucusuna bağlanılamadı. Hata: ${err.message}`)
            }

            this.client.logger.info('RabbitMQ sunucusuna başarıyla bağlanıldı.')
            connection.createChannel((err, channel) => {
                if(err){
                    this.client.logger.info(`RabbitMQ kanalı oluşturulamadı. Hata: ${err.message}`)
                }

                channel.assertQueue(RabbitMQ.channels.premium, {
                    durable: false
                })

                this.client.logger.info('RabbitMQ premium kanalı dinlenmeye başlandı.')
                channel.consume(RabbitMQ.channels.premium, async data => {
                    const premium = JSON.parse(data.content.toString())
                    if(premium.server_id){
                        const server = await this.client.servers.get(premium.server_id)
                        if(server)
                            server.premium = premium.status === PremiumStatus.CONTINUES ? new Premium(premium) : null
                    }
                }, {
                    noAck: true
                })
            })
        })
    }

}
