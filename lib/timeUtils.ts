
export const getSASTDateTime = (date = new Date()) => {
    // Validate date - if invalid, use current date
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    
    // 1. Get components in SAST
    const sastFormatter = new Intl.DateTimeFormat('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = sastFormatter.formatToParts(validDate);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hour}:${minute}`;
    const formattedFullTime = `${hour}:${minute}:${second}`;
    
    // 2. Get Day Index (0-6) reliably for SAST
    // We create a date object that represents the SAST time as if it were UTC, 
    // then get the day of the week from it.
    const sastDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    const dayIndex = sastDate.getUTCDay(); // 0 (Sun) to 6 (Sat)
    
    return { 
        date: formattedDate, 
        time: formattedTime, 
        fullTime: formattedFullTime,
        dayIndex: dayIndex,
        hour: parseInt(hour || '0')
    };
};
