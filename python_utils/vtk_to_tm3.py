import xml.etree.ElementTree as ET
import base64
import numpy as np
import os

def read_vtp_vtu(fname, prop):

    file_type = fname[-3::]

    tree = ET.parse(fname)
    root = tree.getroot()

    appended_data_string = root.find("./AppendedData").text.strip()[1:]

    data_arrays=[]
    for data_array in root.iter('DataArray'):
        d = data_array.attrib
        data_array_now = {'name':d['Name'], 'type':d['type'], 'offset':int(d['offset'])}
        data_arrays.append(data_array_now)

    for indx, data_array in enumerate(data_arrays):
        offset_now = data_array['offset']
        type_now = data_array['type']

        if ( indx == len(data_arrays)-1 ):
            offset_nxt = len(appended_data_string)
        else:    
            offset_nxt = data_arrays[indx+1]['offset']

        buffer = base64.b64decode(appended_data_string[offset_now:offset_nxt])

        if ( type_now == 'Float64' ):
            data = np.frombuffer( buffer, dtype=np.float64, offset=8)
            data_array['data'] = np.float32(data)

        if ( type_now == 'Int64' ):
            data = np.frombuffer( buffer, dtype=np.int64, offset=8)
            data_array['data'] = np.int32(data)

    if ( file_type == "vtp"):
        polys = root.find("./PolyData/Piece/Polys")

    if ( file_type == "vtu"):
        polys = root.find("./UnstructuredGrid/Piece/Cells")

    for data_array in polys.iter('DataArray'):
        d = data_array.attrib
        if (d['Name'] == "connectivity"):
            polys_connectivity_offset = int(d['offset'])
        if (d['Name'] == "offsets"):
            polys_offsets_offset = int(d['offset'])

    indices = []
    offsets = [ d for d in data_arrays if d['offset'] == polys_offsets_offset][0]['data']
    connectivity = [ d for d in data_arrays if d['offset'] == polys_connectivity_offset][0]['data']
    offset_last = 0
    for offset_now in offsets:
        nverts_now = offset_now - offset_last
        if (nverts_now == 3):
            # triangle
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+1])
            indices.append(connectivity[offset_last+2])
        if (nverts_now == 4):
            # quad - split into 2 triangles
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+1])
            indices.append(connectivity[offset_last+2])
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+2])
            indices.append(connectivity[offset_last+3])
        if (nverts_now == 5):
            # pent - split into 3 triangles
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+1])
            indices.append(connectivity[offset_last+2])
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+2])
            indices.append(connectivity[offset_last+3])
            indices.append(connectivity[offset_last])
            indices.append(connectivity[offset_last+3])
            indices.append(connectivity[offset_last+4])
        offset_last = offset_now

    indices = np.asarray(indices, dtype=np.int32)

    if ( np.size(indices) == 0 ):
        return 0, 0, np.array([]), np.array([]), np.array([])
    vertices = [ d for d in data_arrays if d['name'] == 'Points'][0]['data']
    values = [ d for d in data_arrays if d['name'] == prop][0]['data']

    nverts = np.int32(np.size(vertices)/3)
    ntris = np.int32(np.size(indices)/3)

    return nverts, ntris, vertices, indices, values

def centre_vertices(vertices):

    xvert = vertices[0::3] 
    yvert = vertices[1::3] 
    zvert = vertices[2::3] 

    xmid = np.mean(xvert)
    ymid = np.mean(yvert)
    zmid = np.mean(zvert)

    #xvert -= xmid
    #yvert -= ymid
    #zvert -= zmid

    rmax = np.sqrt(np.max((xvert-xmid)**2 + (yvert-ymid)**2 + (zvert-zmid)**2))

    xmin = np.min(xvert) 
    xmax = np.max(xvert)
    ymin = np.min(yvert) 
    ymax = np.max(yvert)
    zmin = np.min(zvert) 
    zmax = np.max(zvert)
  

    vertices[0::3] = xvert
    vertices[1::3] = yvert
    vertices[2::3] = zvert

    return vertices, np.float32(rmax), np.float32([xmin,xmax]), np.float32([ymin,ymax]), np.float32([zmin,zmax])

def normalise(values):

    vmin = np.min(values)
    vmax = np.max(values)
    v_range = vmax - vmin
    values = (values - vmin)/v_range

    return values, np.float32([vmin,vmax])

def read_vtm(fname):

    tree = ET.parse(fname)
    root = tree.getroot()

    file_names = []
    for data_set in root.iter('DataSet'):
        d = data_set.attrib
        try:
            file_names.append(d['file'])
        except:
            pass
      
    return file_names

def vtm_to_tm3(config):

    f = open(config['output_file'],"wb")

    steps = config['steps']

    steady = False
    if ( steps == None ):
        steady = True

    if ( steady ):
        f.write(np.int32(1).tobytes())
    else:
        f.write(np.int32(len(steps)).tobytes())

    surfaces = config['surfaces']
    f.write(np.int32(len(surfaces)).tobytes())

    if ( steps == None ):
        steps = ["steady"]

    cwd = os.getcwd()

    istep = 0
    for step in steps:

        for surface in surfaces:
            f.write(np.array(surface['name'],dtype='S96').tobytes())
            files = surface['files']

            for indx_vtm, fp in enumerate(files):

                if ( steady ):
                    vtm_file = fp['fname']
                else:
                    template = fp['fname_root']+"{:"+fp['fname_fmt']+"}.vtm"
                    vtm_file = template.format(step)
                    print(vtm_file)

                os.chdir(fp['path'])
                selected_props = fp['props'] # list but current version only uses first entry
                vtp_file_names = read_vtm(vtm_file)
        
                for indx_vtp, file_name in enumerate(vtp_file_names):
                    if (indx_vtp == 0 and indx_vtm == 0):
                        nverts, ntris, vertices, indices, values = read_vtp_vtu(file_name, selected_props[0])
                    else:
                        nverts_now, ntris_now, vertices_now, indices_now, values_now = read_vtp_vtu(file_name, selected_props[0])
                        if (nverts_now == 0):
                            continue
                        indices_now += nverts
                        nverts += nverts_now
                        ntris += ntris_now
                        vertices = np.concatenate((vertices, vertices_now))
                        indices = np.concatenate((indices,indices_now))
                        values = np.concatenate((values,values_now))

                os.chdir(cwd)
       
            vertices, rmax, x_min_max, y_min_max, z_min_max = centre_vertices(vertices)
            values, v_min_max = normalise(values)

            if ( 'store_value_range' not in surface ):
                surface['store_value_range'] = True
            if (surface['store_value_range'] == False):
                v_min_max = np.float32([0.0,1.0])

            f.write(nverts.tobytes())
            if ( istep > 0 and fp['fixed_vertices'] ):
                f.write(np.int32(0).tobytes()) # write ntris=0 if fixed vertices
            else:
                f.write(ntris.tobytes())
            f.write(np.int32(1).tobytes())  # only one property for now
            f.write(rmax.tobytes())
            f.write(x_min_max.tobytes())
            f.write(y_min_max.tobytes())
            f.write(z_min_max.tobytes())
            if ( istep == 0 or not fp['fixed_vertices'] ):
                f.write(vertices.tobytes())
                f.write(indices.tobytes())
            f.write(np.array(files[0]['props'][0],dtype='S96').tobytes())
            f.write(v_min_max.tobytes())
            f.write(values.tobytes())

            istep += 1

    f.close()

