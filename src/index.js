const __main__ = async () => {
    //@comments: button container to download as csv, excel, pdf, and where we gonna be inject our "download as JSON" button
    const $actionButtonsContainer = document.querySelector('.uir_list_top_button_bar tbody tr td table tbody tr');
    //comments: get the base url from the action attribute 
    const baseURL = document.querySelector('#footer_actions_form').getAttribute('action');
    //comments: get mandatory query params to create a request to download a csv
    const queryParams = getQueryParams(Array.from(document.querySelectorAll('.uir_list_buttonbar_left input')));

    //#region [@comments: crate our custom "download as JSON" button and appends in a new cell to put inside in the $actionButtonsContainer next to others]
    const $cell = document.createElement('td');
    const $button = document.createElement('button');
    $button.setAttribute('style', 'border: none; background:none; margin:0px; padding:0px;');
    $button.innerHTML = `<img class="uir-list-icon-button" src="https://raw.githubusercontent.com/raloz/netsuite-search-results-as-json/main/images/toJSON-128.png" display:inline-block; margin:0px;">`;
    $cell.append($button);

    $actionButtonsContainer.prepend($cell);
    //#endregion

    $button.addEventListener('click', async (e) => {
        e.preventDefault();
        document.body.style.cursor = 'progress';
        $button.setAttribute('disabled', 'disabled');

        const $anchorDownload = document.createElement('a');
        const json = await dataToJson(baseURL, queryParams);
        $anchorDownload.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
        $anchorDownload.setAttribute('download', `Search${queryParams._csrf}.json`);

        $anchorDownload.style.display = 'none';
        document.body.appendChild($anchorDownload);

        $anchorDownload.click();
        document.body.removeChild($anchorDownload);
        document.body.style.cursor = 'default';
        $button.removeAttribute('disabled');
    });
}

__main__();

/**
 * @description 
 * @param {String} baseURL 
 * @param {Object} queryParams 
 * @returns 
 */
function dataToJson(baseURL, queryParams) {
    const { searchid, dle, size, sortcol, sortdir, _csrf } = queryParams;

    return new Promise(async (resolve, reject) => {
        const result = await fetch(`${baseURL}&style=NORMAL&searchid=${searchid}&dle=${dle}&sortcol=${sortcol}&sortdir=${sortdir}&csv=Export&OfficeXML=F&pdf=&size=${size}&_csrf=${_csrf}&twbx=F&segment=`);
        const data = await result.blob();
        const rawData = await data.text();

        const [header, ...lines] = rawData.split('\n');
        const properties = header.split(',');

        const rawOutput = lines.reduce((result, line) => {
            if (!line) return result;
            const currentLine = splitText(line, ',');

            const currentObject = {};
            for (index in properties) {
                currentObject[properties[index]] = currentLine[index];
            }
            result.push(currentObject)
            return result;
        }, []);

        resolve(JSON.stringify(rawOutput, null, 4));
    });
}

/**
 * @description 
 * @param {String} strData 
 * @param {String} strDelimiter 
 * @returns {Array<String>}
 */
function splitText(strData, strDelimiter) {
    const delimiter = (strDelimiter || ",");
    // Create a regular expression to parse the CSV values.
    const objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + delimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + delimiter + "\\r\\n]*))"
        ),
        "gi"
    );
    const arrData = [];
    let arrMatches = null;

    while (arrMatches = objPattern.exec(strData)) {
        let strMatchedDelimiter = arrMatches[1];

        if (strMatchedDelimiter.length && (strMatchedDelimiter != delimiter)) {
            arrData.push('')
        };

        let strMatchedValue = arrMatches[2] ? arrMatches[2].replace(new RegExp("\"\"", "g"), "\"") : arrMatches[3];
        arrData.push(strMatchedValue);
    }
    // Return the parsed data.
    return arrData;
}

/**
 * @description 
 * @param {Array<HTMLElement>} inputElements 
 * @returns {Object}
 */
function getQueryParams(inputElements) {
    const queryParams = inputElements.reduce((result, el) => {
        result[el.getAttribute('name')] = el.value;
        return result;
    }, {});

    return queryParams
}