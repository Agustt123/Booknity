import { MailService } from './mail.service'; // Asegúrate de importar MailService
import { DonationsService } from 'src/mercado-pago/donation.service';
import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express'; // Importa Response desde express
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Mail')
@Controller('mail')
export class MailController {  // Renombrado a MailController para reflejar mejor su función
  constructor(
    private readonly donationService: DonationsService,
    private readonly mailService: MailService, // Inyecta MailService
  ) {}

  // Endpoint para el webhook de donaciones
  @Post('webhook')
  async receiveWebhook(@Body() body: any, @Res() res: Response) {
    try {
      // Maneja el webhook
      await this.donationService.handleWebhook(body);

      const paymentStatus = body.data.attributes.status;
      const payerEmail = body.data.attributes.payer.email;

      // Solo envía el correo si el pago fue aprobado
      if (paymentStatus === 'approved') {
        await this.mailService.sendThankYouEmail(payerEmail);
      }

      return res.sendStatus(204); // HTTP 204 sin contenido
    } catch (error) {
      console.error('Error handling webhook:', error);
      return res.status(500).json({ message: 'Webhook handling error', error: error.message });
    }
  }

  // Endpoint para el envío de correos masivos
  @Post('send-mass-emails')
  async sendMassEmails(
    @Body('emails') emails: string[],
    @Body('subject') subject: string,
    @Body('text') text: string,
    @Body('html') html: string,
    @Res() res: Response,
  ) {
    if (!emails || emails.length === 0) {
      throw new BadRequestException('La lista de emails es requerida');
    }

    try {
      await this.mailService.sendMassEmails(emails, subject, text, html);
      return res.status(200).json({ message: 'Correos masivos enviados' });
    } catch (error) {
      console.error('Error al enviar correos masivos:', error);
      return res.status(500).json({ message: 'Error al enviar correos masivos', error: error.message });
    }
  }
}
