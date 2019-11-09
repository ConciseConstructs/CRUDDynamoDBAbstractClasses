import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    item:any
  }


export abstract class UpdateHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['item']
          this.needsToConnectToDatabase = true
        }








    protected performActions() {
      this.db.put(this.makePutSyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        private makePutSyntax() {
          return {
            TableName: `${ process.env.saasName }-${ process.env.stage }`,
            Item: this.request.item
          }
        }

} // End Main Handler Function -------
