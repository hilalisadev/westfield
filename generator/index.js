const fs = require('fs');
const util = require('util');

const xml2js = require('xml2js');

const wfg = {};

wfg.ProtocolParser = class {

    _parseItfRequest(out, itfRequest, opcode) {
        const reqName = itfRequest.$.name;

        //function docs
        const description = itfRequest.description;
        description.forEach((val) => {
            out.write("\t/**\n");
            if (val.hasOwnProperty("_")) {
                val._.split("\n").forEach((line) => {
                    out.write("\t *" + line + "\n");
                });
            }

            if (itfRequest.hasOwnProperty("arg")) {
                const reqArgs = itfRequest.arg;
                out.write("\t *\n");
                reqArgs.forEach((arg) => {
                    const argDescription = arg.$.summary;
                    const argName = arg.$.name;
                    out.write(util.format("\t * @param %s %s \n", argName, argDescription));
                });
                out.write("\t *\n");
            }

            out.write("\t */\n");
        });

        //function
        out.write(util.format("\t%s(", reqName));
        if (itfRequest.hasOwnProperty("arg")) {
            const reqArgs = itfRequest.arg;
            for (let i = 0; i < reqArgs.length; i++) {
                const arg = reqArgs[i];
                const argName = arg.$.name;
                if (i !== 0) {
                    out.write(", ");
                }
                out.write(argName);
            }
        }
        out.write("){\n");
        out.write(util.format("\t\tthis._connection._marshall(this._id, %d, [", opcode));

        //function args


        out.write(util.format("]);\n"));
        out.write("\t}\n");
    }

    _parseInterface(out, protocolItf) {
        const itfName = protocolItf.$.name;
        const itfVersion = protocolItf.$.version;

        console.log(util.format("Processing interface %s v%d", itfName, itfVersion));

        //if version is 1, we extends from WObject, else we extend from the previous version.
        for (let i = 1; i <= itfVersion; i++) {

            //class docs
            const description = protocolItf.description;
            description.forEach((val) => {
                out.write("/**\n");
                if (val.hasOwnProperty("_")) {
                    val._.split("\n").forEach((line) => {
                        out.write(" *" + line + "\n");
                    });
                }
                out.write(" */\n");
            });

            //class
            const className = util.format("%sV%d", itfName, i);
            if (i === 1) {
                out.write(util.format("wfc.%s = class %s extends wfc.WObject {\n", className, className));
            } else {
                out.write(util.format("wfc.%s = class %s extends wfc.%sV%d {\n", className, className, itfName, i - 1));
            }

            //interface can have no requests, so we need to check for it's absence.
            if (protocolItf.hasOwnProperty("request")) {
                const itfRequests = protocolItf.request;
                for (let i = 0; i < itfRequests.length; i++) {
                    this._parseItfRequest(out, itfRequests[i], i + 1);
                }
            }

            out.write("};\n");
        }
    }

    _parseProtocol(jsonProtocol) {
        const protocolName = jsonProtocol.protocol.$.name;
        const out = fs.createWriteStream(util.format("westfield-client-%s.js", protocolName));
        out.on('open', (fd) => {
            out.write("/*\n");
            jsonProtocol.protocol.copyright.forEach((val) => {
                val.split("\n").forEach((line) => {
                    out.write(" *" + line + "\n");
                });
            });
            out.write(" */\n");

            jsonProtocol.protocol.interface.forEach((itf) => {
                this._parseInterface(out, itf);
            });
        });
    }

    parse() {
        fs.readFile(this.protocolFile, (err, data) => {
            if (err) throw err;
            new xml2js.Parser().parseString(data, (err, result) => {
                if (err) throw err;

                //uncomment to see the protocol as json output
                //console.log(util.inspect(result, false, null));

                this._parseProtocol(result);
                console.log('Done');
            });
        });
    }

    constructor(protocolFile) {
        this.protocolFile = protocolFile;
    }
}


new wfg.ProtocolParser('/usr/share/wayland/wayland.xml').parse();


