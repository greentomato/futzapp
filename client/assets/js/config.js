/* 
 * Facebook share message 
 *
 * 
 * @parameters fbShareMsg
 * %1$s: fecha y d�a en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: hora [HH:mm a]
 * %3$s: nombre de la cancha
 *
 */
var fbShareMsg = "Jugate un futzapp el %1$s a las %2$s en %3$s!";
var fbShareCaption = "Ya reservaste cancha y te faltan jugadores? Armar un partido de f&uacute;tbol entre amigos nunca fue tan f&aacute;cil!";
var fbShareImage = "http://futzapp.com/images/field.jpg";
var fbShareTitle = "Futzapp";

/* 
 * Whatsapp share message 
 *
 * 
 * @parameters wpShareMessage
 * %s: URL del partido a compartir
 *
 */ 
var wpShareMessage = "Sale Futzapp %s!";

/* 
 * 'Me bajo' email template
 *
 * 
 * @parameters
 * %1$s: fecha y d�a en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 * %6$s: nombre del jugador
 *
 */
var meBajoSubject = "%6$s - Me bajo!";
var meBajoMessage = "Me bajo del partido del d�a %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";
			
/* 
 * 'Juego' email template
 *
 * 
 * @parameters
 * %1$s: fecha y d�a en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 * %6$s: nombre del jugador
 *
 */
var juegoSubject = "%6$s - Juego!";
var juegoMessage = "Juego el partido del d�a %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";

/* 
 * 'Partido completo' email template
 *
 * 
 * @parameters
 * %1$s: fecha y d�a en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 *
 */
var completoSubject = "Partido completo!";
var completoMessage = "Ya estamos todos para el partido del d�a %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";