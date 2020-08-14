/**
 * Возвращает true если переданная дата равна или позже начала текущего дня !у клиента по его местному времени!
 * Аргумент - ISO дата начала (полночи) любого дня у пользователя в UTC
 * Для Кирова, например, это будет дата минус один день и 21:00 по UTC
 */
export default (startOfDayUTC) => {
    const date = new Date(startOfDayUTC);

    const clientsUTCZeroHour = date.getUTCHours();
    const clientsMSOffset = (24 - clientsUTCZeroHour)*60*60*1000;
    
    const serversUTCZeroHour = new Date().setHours(0,0,0,0);
    const serversMSOffset = -1 * new Date().getTimezoneOffset()*60*1000;

    const clientsTodayUTCZeroHour = serversUTCZeroHour + serversMSOffset - clientsMSOffset;      

    const result = clientsTodayUTCZeroHour <= date.getTime();

    return result;
}