import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    id:string
  }


export abstract class ReadIdHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'id']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.db.get(this.makeGetIdSyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        protected makeGetIdSyntax() {
          return {
            TableName: `${ process.env.saasName }-${ process.env.stage }`,
            Key: { table: `${ this.request.accountId }.${ process.env.model }`, id: this.request.id }
          }
        }

} // End Main Handler Function -------
