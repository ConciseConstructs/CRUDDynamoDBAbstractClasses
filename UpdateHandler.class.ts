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
          this.needsToExecuteLambdas = true
        }








    protected performActions() {
      this.unlinkOldRecords()
      this.linkNewRecords()
      this.db.put(this.makePutSyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        private unlinkOldRecords() {
          if (!this.request.item.links._unlink) return
          for (let [ table, ids ] of Object.entries(this.request.item.links._unlink as any)) {
            Object.keys(ids).forEach(id => this.unlink({ table: table, id: id }))
          }
          delete this.request.item.links._unlink
        }




            private unlink(params) {
              this.lambda.invoke({
                FunctionName: `Database-${ process.env.stage }-links-unlink`,
                Payload: JSON.stringify(this.makeUnlinkPayload(params))
              }).promise()
            }




                private makeUnlinkPayload(params:{ table:string, id:string }) {
                  return {
                    silo: `${ process.env.saasName }-${ process.env.stage }`,
                    table: params.table,
                    id: params.id,
                    foreignTable: `${ process.env.model }`,
                    foreignId: this.request.item.id,
                    accountId: `${ this.request.item.table.split('.')[0] }`,
                    link: true
                  }
                }




        private linkNewRecords() {
          if (!this.request.item.links._link) return
          for (let [ table, ids ] of Object.entries(this.request.item.links._link as any)) {
            Object.keys(ids).forEach(id => this.link({ table: table, id: id }))
          }
          delete this.request.item.links._link
        }




            private link(params:{ table:string, id:string }) {
              this.lambda.invoke({
                FunctionName: `Database-${ process.env.stage }-links-link`,
                Payload: JSON.stringify(this.makeLinkPayload(params))
              }).promise()
            }




                private makeLinkPayload(params) {
                  return {
                    silo: `${ process.env.saasName }-${ process.env.stage }`,
                    table: params.table,
                    id: params.id,
                    foreignTable: `${ process.env.model }`,
                    foreignId: this.request.item.id,
                    accountId: `${ this.request.item.table.split('.')[0] }`,
                    link: true
                  }
                }




        protected makePutSyntax() {
          return {
            TableName: `${ process.env.saasName }-${ process.env.stage }`,
            Item: this.request.item
          }
        }

} // End Main Handler Function -------
