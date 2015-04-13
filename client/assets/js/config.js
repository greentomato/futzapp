/*
 * Set PRD or DEV mode
 */
var prd = false;

/*
 * Set PRD or DEV mode
 */
var fbAppIdDEV = "1573351059604037";
var fbAppIdPRD = "1450926871846457";
 
/* 
 * Facebook share message 
 *
 * 
 * @parameters fbShareMsg
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
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
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 * %6$s: nombre del jugador
 *
 */
var meBajoSubject = "%6$s - Me bajo!";
var meBajoMessage = "Me bajo del partido del día %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";
			
/* 
 * 'Juego' email template
 *
 * 
 * @parameters
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 * %6$s: nombre del jugador
 *
 */
var juegoSubject = "%6$s - Juego!";
var juegoMessage = "Juego el partido del día %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";

/* 
 * 'Partido completo' email template
 *
 * 
 * @parameters
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 *
 */
var completoSubject = "Partido completo!";
var completoMessage = "Ya estamos todos para el partido del día %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";

/* 
 * 'Partido cancelado' email template
 *
 * 
 * @parameters
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 *
 */
var canceladoSubject = "Partido cancelado!";
var canceladoMessage = "Se cancela el partido del día %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y organiza uno nuevo!";

/* 
 * 'Te dieron de baja' email template
 *
 * 
 * @parameters
 * %1$s: fecha y día en que se juega el partido [lunes - viernes] [1 - 31]
 * %2$s: mes en que se juega el partido [Enero - Diciembre]
 * %3$s: hora [HH:mm a]
 * %4$s: nombre de la cancha
 * %5$s: URL del partido
 *
 */
var teBajaronSubject = "Te dieron de baja!";
var teBajaronMessage = "Te dieron de baja del partido del día %1$s de %2$s a las %3$s en %4$s<br/>Entra a Futzapp y mira como quedaron los equipos: %5$s";