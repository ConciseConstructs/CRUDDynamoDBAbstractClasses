import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    view?:any
  }


export abstract class HandlerObject extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse
    private syntax:any


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      if (this.request.view) this.makeProjectionSyntax()
      else this.makeAllSyntax()
      this.db.query(this.syntax).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        private makeAllSyntax() {
          this.syntax =  {
            TableName: `${ process.env.saasName }-${ process.env.stage }`,
            KeyConditionExpression: '#x = :y',
            ExpressionAttributeNames: {
              "#x": 'table'
            },
            ExpressionAttributeValues: {
              ':y': `${ this.request.accountId }.${ process.env.model }`,
            }
          }
        }




        private makeProjectionSyntax() {
          if (this.request.view) this.request.view = JSON.parse(this.request.view)
          this.makeAllSyntax()
          this.syntax.ProjectionExpression = this.request.view.ProjectionExpression
          for (let [ placeholder, value ] of Object.entries(this.request.view.ExpressionAttributeNames) as any) {
            this.syntax.ExpressionAttributeNames[placeholder] = value
          }
        }

} // End Main Handler Function -------
