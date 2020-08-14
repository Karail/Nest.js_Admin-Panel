export default (day) => {
    /**
     * Миксин преобразует формат дня недели JS в формат метода MySQL DAYOFWEEK
     * В КОНТРОЛЛЕРАХ ВСЕ ОПЕРАЦИИ С ДНЯМИ НЕДЕЛИ ДОЛЖНЫ ВЫПОЛНЯТЬСЯ С УЧЕТОМ ФОРМАТА МЕТОДА MySQL DAYOFWEEK:
     * вс 1
     * пн 2
     * вт 3
     * ср 4
     * чт 5
     * пт 6
     * сб 7
     */
    const dayOfWeek = day + 1;
    return dayOfWeek;
};