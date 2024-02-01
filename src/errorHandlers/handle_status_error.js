import Ora from "ora";

export default class StatusError {
    handleStatusError = ( status, err ) => {
        const spinner = Ora();

        switch ( status ) {
            case 404:
                spinner.fail( "Invalid Organization and/or Project provided" );
                return false;
            case 401:
                spinner.fail( "Invalid PAT provided" );
                return false;
            case 500:
                spinner.fail( "Unknow error ", err )
                console.error( err );
                return false;
            default:
                return true;
        }
    }
}