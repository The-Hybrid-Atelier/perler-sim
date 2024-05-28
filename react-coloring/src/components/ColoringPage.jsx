
import {loadPage} from './ColoringBook.jsx';
import { useEffect } from 'react';

const ColoringPage = ({paperReady, page})=>{
    useEffect(() => {
        if(paperReady){ 
            console.log(page);
            loadPage({
                url: page,
                postProcess: (item)=> item.sendToBack()
            });
        }
    }, [paperReady, page])
}
export {ColoringPage}